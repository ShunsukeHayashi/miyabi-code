export type IssueState = 'open' | 'closed';

export type IssuePriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface IssueLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface IssueAssignee {
  id: string;
  login: string;
  avatar_url: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  body?: string;
  state: IssueState;
  priority?: IssuePriority;
  labels: IssueLabel[];
  assignees: IssueAssignee[];
  created_at: string;
  updated_at: string;
  closed_at?: string;
  comments: number;
  repository: string;
  author: string;
}

export interface IssuesListResponse {
  issues: Issue[];
  total: number;
}

export interface IssueFilter {
  state?: IssueState;
  priority?: IssuePriority;
  label?: string;
  assignee?: string;
  search?: string;
  repository?: string;
}
