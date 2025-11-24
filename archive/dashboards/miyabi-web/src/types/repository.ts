/**
 * Repository types
 */

export interface Repository {
  id: string;
  user_id: string;
  github_repo_id: number;
  owner: string;
  name: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
  html_url: string;
  body: string | null;
}

export interface IssueComment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}
