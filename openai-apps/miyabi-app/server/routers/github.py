#!/usr/bin/env python3
"""
Miyabi MCP Server - GitHub Router
GitHub API operations
"""

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from github import Github

from ..core.config import settings
from ..core.security import verify_bearer_token
from ..core.logging import get_logger
from ..core.exceptions import GitHubError, NotFoundError, ValidationError

logger = get_logger("miyabi.github")

router = APIRouter(prefix="/github", tags=["GitHub"])


# ===========================================
# Response Models
# ===========================================

class IssueResponse(BaseModel):
    """GitHub issue response"""
    number: int
    title: str
    state: str
    author: str
    created_at: datetime
    updated_at: datetime
    labels: List[str]
    assignees: List[str]
    body: Optional[str] = None
    url: str


class IssueCreateRequest(BaseModel):
    """Create issue request"""
    title: str = Field(..., min_length=1, max_length=256)
    body: str = Field(..., min_length=1)
    labels: Optional[List[str]] = None
    assignees: Optional[List[str]] = None


class IssueUpdateRequest(BaseModel):
    """Update issue request"""
    title: Optional[str] = None
    body: Optional[str] = None
    state: Optional[str] = None
    labels: Optional[List[str]] = None
    assignees: Optional[List[str]] = None


class PRResponse(BaseModel):
    """GitHub PR response"""
    number: int
    title: str
    state: str
    author: str
    created_at: datetime
    updated_at: datetime
    head: str
    base: str
    mergeable: Optional[bool] = None
    url: str


class PRCreateRequest(BaseModel):
    """Create PR request"""
    title: str = Field(..., min_length=1, max_length=256)
    body: str
    head: str
    base: str = "main"


class BranchResponse(BaseModel):
    """Branch response"""
    name: str
    protected: bool
    sha: str


# ===========================================
# Helper Functions
# ===========================================

def get_github_client() -> Github:
    """Get authenticated GitHub client"""
    if not settings.github_token:
        raise GitHubError("GitHub token not configured")
    return Github(settings.github_token)


def get_repo(g: Github):
    """Get repository object"""
    try:
        return g.get_repo(settings.github_repo_full_name)
    except Exception as e:
        raise GitHubError(f"Failed to access repository: {str(e)}")


def issue_to_response(issue) -> IssueResponse:
    """Convert GitHub issue to response model"""
    return IssueResponse(
        number=issue.number,
        title=issue.title,
        state=issue.state,
        author=issue.user.login,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        labels=[l.name for l in issue.labels],
        assignees=[a.login for a in issue.assignees],
        body=issue.body,
        url=issue.html_url,
    )


def pr_to_response(pr) -> PRResponse:
    """Convert GitHub PR to response model"""
    return PRResponse(
        number=pr.number,
        title=pr.title,
        state=pr.state,
        author=pr.user.login,
        created_at=pr.created_at,
        updated_at=pr.updated_at,
        head=pr.head.ref,
        base=pr.base.ref,
        mergeable=pr.mergeable,
        url=pr.html_url,
    )


# ===========================================
# Issue Endpoints
# ===========================================

@router.get("/issues", response_model=List[IssueResponse])
async def list_issues(
    state: str = Query(default="open", regex="^(open|closed|all)$"),
    limit: int = Query(default=10, ge=1, le=100),
    token: str = Depends(verify_bearer_token),
):
    """List repository issues"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        
        issues = []
        for issue in repo.get_issues(state=state)[:limit]:
            if not issue.pull_request:  # Exclude PRs
                issues.append(issue_to_response(issue))
        
        return issues
    except GitHubError:
        raise
    except Exception as e:
        raise GitHubError(f"Failed to list issues: {str(e)}")


@router.get("/issues/{issue_number}", response_model=IssueResponse)
async def get_issue(
    issue_number: int,
    token: str = Depends(verify_bearer_token),
):
    """Get a specific issue"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        issue = repo.get_issue(issue_number)
        return issue_to_response(issue)
    except Exception as e:
        if "404" in str(e):
            raise NotFoundError("Issue", issue_number)
        raise GitHubError(f"Failed to get issue: {str(e)}")


@router.post("/issues", response_model=IssueResponse)
async def create_issue(
    request: IssueCreateRequest,
    token: str = Depends(verify_bearer_token),
):
    """Create a new issue"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        
        issue = repo.create_issue(
            title=request.title,
            body=request.body,
            labels=request.labels or [],
            assignees=request.assignees or [],
        )
        
        logger.info(f"Created issue #{issue.number}: {issue.title}")
        return issue_to_response(issue)
    except Exception as e:
        raise GitHubError(f"Failed to create issue: {str(e)}")


@router.patch("/issues/{issue_number}", response_model=IssueResponse)
async def update_issue(
    issue_number: int,
    request: IssueUpdateRequest,
    token: str = Depends(verify_bearer_token),
):
    """Update an existing issue"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        issue = repo.get_issue(issue_number)
        
        kwargs = {}
        if request.title is not None:
            kwargs["title"] = request.title
        if request.body is not None:
            kwargs["body"] = request.body
        if request.state is not None:
            kwargs["state"] = request.state
        if request.labels is not None:
            kwargs["labels"] = request.labels
        if request.assignees is not None:
            kwargs["assignees"] = request.assignees
        
        if kwargs:
            issue.edit(**kwargs)
        
        logger.info(f"Updated issue #{issue_number}")
        return issue_to_response(issue)
    except Exception as e:
        if "404" in str(e):
            raise NotFoundError("Issue", issue_number)
        raise GitHubError(f"Failed to update issue: {str(e)}")


@router.delete("/issues/{issue_number}")
async def close_issue(
    issue_number: int,
    comment: Optional[str] = None,
    token: str = Depends(verify_bearer_token),
):
    """Close an issue"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        issue = repo.get_issue(issue_number)
        
        if comment:
            issue.create_comment(comment)
        
        issue.edit(state="closed")
        
        logger.info(f"Closed issue #{issue_number}")
        return {"status": "closed", "issue_number": issue_number}
    except Exception as e:
        if "404" in str(e):
            raise NotFoundError("Issue", issue_number)
        raise GitHubError(f"Failed to close issue: {str(e)}")


# ===========================================
# PR Endpoints
# ===========================================

@router.get("/pulls", response_model=List[PRResponse])
async def list_prs(
    state: str = Query(default="open", regex="^(open|closed|all)$"),
    limit: int = Query(default=10, ge=1, le=100),
    token: str = Depends(verify_bearer_token),
):
    """List repository pull requests"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        
        prs = []
        for pr in repo.get_pulls(state=state)[:limit]:
            prs.append(pr_to_response(pr))
        
        return prs
    except Exception as e:
        raise GitHubError(f"Failed to list PRs: {str(e)}")


@router.get("/pulls/{pr_number}", response_model=PRResponse)
async def get_pr(
    pr_number: int,
    token: str = Depends(verify_bearer_token),
):
    """Get a specific PR"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        pr = repo.get_pull(pr_number)
        return pr_to_response(pr)
    except Exception as e:
        if "404" in str(e):
            raise NotFoundError("Pull Request", pr_number)
        raise GitHubError(f"Failed to get PR: {str(e)}")


@router.post("/pulls", response_model=PRResponse)
async def create_pr(
    request: PRCreateRequest,
    token: str = Depends(verify_bearer_token),
):
    """Create a new pull request"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        
        pr = repo.create_pull(
            title=request.title,
            body=request.body,
            head=request.head,
            base=request.base,
        )
        
        logger.info(f"Created PR #{pr.number}: {pr.title}")
        return pr_to_response(pr)
    except Exception as e:
        raise GitHubError(f"Failed to create PR: {str(e)}")


@router.post("/pulls/{pr_number}/merge")
async def merge_pr(
    pr_number: int,
    merge_method: str = Query(default="squash", regex="^(merge|squash|rebase)$"),
    token: str = Depends(verify_bearer_token),
):
    """Merge a pull request"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        pr = repo.get_pull(pr_number)
        
        if not pr.mergeable:
            raise ValidationError("PR is not mergeable")
        
        result = pr.merge(merge_method=merge_method)
        
        logger.info(f"Merged PR #{pr_number}")
        return {
            "merged": result.merged,
            "sha": result.sha,
            "message": result.message,
        }
    except ValidationError:
        raise
    except Exception as e:
        if "404" in str(e):
            raise NotFoundError("Pull Request", pr_number)
        raise GitHubError(f"Failed to merge PR: {str(e)}")


# ===========================================
# Repository Endpoints
# ===========================================

@router.get("/repo")
async def get_repo_info(
    token: str = Depends(verify_bearer_token),
):
    """Get repository information"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        
        return {
            "name": repo.name,
            "full_name": repo.full_name,
            "description": repo.description,
            "default_branch": repo.default_branch,
            "stars": repo.stargazers_count,
            "forks": repo.forks_count,
            "open_issues": repo.open_issues_count,
            "url": repo.html_url,
            "created_at": repo.created_at.isoformat(),
            "updated_at": repo.updated_at.isoformat(),
        }
    except Exception as e:
        raise GitHubError(f"Failed to get repo info: {str(e)}")


@router.get("/repo/branches", response_model=List[BranchResponse])
async def list_branches(
    limit: int = Query(default=20, ge=1, le=100),
    token: str = Depends(verify_bearer_token),
):
    """List repository branches"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        
        branches = []
        for branch in repo.get_branches()[:limit]:
            branches.append(BranchResponse(
                name=branch.name,
                protected=branch.protected,
                sha=branch.commit.sha,
            ))
        
        return branches
    except Exception as e:
        raise GitHubError(f"Failed to list branches: {str(e)}")


@router.get("/repo/commits")
async def list_commits(
    limit: int = Query(default=10, ge=1, le=100),
    branch: Optional[str] = None,
    token: str = Depends(verify_bearer_token),
):
    """List recent commits"""
    try:
        g = get_github_client()
        repo = get_repo(g)
        
        kwargs = {}
        if branch:
            kwargs["sha"] = branch
        
        commits = []
        for commit in repo.get_commits(**kwargs)[:limit]:
            commits.append({
                "sha": commit.sha,
                "message": commit.commit.message.split("\n")[0],
                "author": commit.commit.author.name,
                "date": commit.commit.author.date.isoformat(),
                "url": commit.html_url,
            })
        
        return commits
    except Exception as e:
        raise GitHubError(f"Failed to list commits: {str(e)}")
