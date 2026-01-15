/**
 * GitHub OAuth Flow Implementation
 * Miyabi AI Agent Framework - GitHub Marketplace Integration
 */

import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import {
  getGitHubAppConfig,
  GITHUB_OAUTH_AUTHORIZE_URL,
  GITHUB_OAUTH_TOKEN_URL,
  GITHUB_API_BASE_URL,
  GITHUB_APP_SCOPES,
} from './config';
import type {
  GitHubOAuthTokenResponse,
  GitHubUserResponse,
  GitHubInstallationToken,
  GitHubAppInstallation,
  MiyabiGitHubUser,
} from './types';

interface OAuthState {
  nonce: string;
  redirectUrl?: string;
  timestamp: number;
  installationId?: number;
}

const stateStore = new Map<string, OAuthState>();
const STATE_EXPIRY_MS = 10 * 60 * 1000;

export function generateOAuthState(redirectUrl?: string, installationId?: number): string {
  const nonce = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();

  const state: OAuthState = {
    nonce,
    redirectUrl,
    timestamp,
    installationId,
  };

  const stateToken = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
    .update(JSON.stringify(state))
    .digest('hex');

  stateStore.set(stateToken, state);

  setTimeout(() => {
    stateStore.delete(stateToken);
  }, STATE_EXPIRY_MS);

  return stateToken;
}

export function validateOAuthState(stateToken: string): OAuthState | null {
  const state = stateStore.get(stateToken);
  if (!state) {
    return null;
  }

  if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
    stateStore.delete(stateToken);
    return null;
  }

  stateStore.delete(stateToken);
  return state;
}

export function buildOAuthAuthorizeUrl(state: string, redirectUri?: string): string {
  const config = getGitHubAppConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri || config.callbackUrl,
    scope: GITHUB_APP_SCOPES.join(' '),
    state,
    allow_signup: 'true',
  });

  return `${GITHUB_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri?: string,
): Promise<GitHubOAuthTokenResponse> {
  const config = getGitHubAppConfig();

  const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri || config.callbackUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`);
  }

  return data as GitHubOAuthTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<GitHubOAuthTokenResponse> {
  const config = getGitHubAppConfig();

  const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Token refresh error: ${data.error_description || data.error}`);
  }

  return data as GitHubOAuthTokenResponse;
}

export async function revokeAccessToken(accessToken: string): Promise<void> {
  const config = getGitHubAppConfig();

  const response = await fetch(
    `${GITHUB_API_BASE_URL}/applications/${config.clientId}/token`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ access_token: accessToken }),
    },
  );

  if (!response.ok && response.status !== 204) {
    console.warn(`Failed to revoke token: ${response.status}`);
  }
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
  const response = await fetch(`${GITHUB_API_BASE_URL}/user`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get user: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getGitHubUserEmails(
  accessToken: string,
): Promise<Array<{ email: string; primary: boolean; verified: boolean }>> {
  const response = await fetch(`${GITHUB_API_BASE_URL}/user/emails`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get user emails: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getUserInstallations(
  accessToken: string,
): Promise<{ installations: GitHubAppInstallation[] }> {
  const response = await fetch(`${GITHUB_API_BASE_URL}/user/installations`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get user installations: ${response.status} ${errorText}`);
  }

  return response.json();
}

export function generateAppJWT(): string {
  const config = getGitHubAppConfig();

  if (!config.privateKey) {
    throw new Error('GitHub App private key is not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 10 * 60,
    iss: config.appId,
  };

  return jwt.sign(payload, config.privateKey, { algorithm: 'RS256' });
}

export async function getInstallationAccessToken(
  installationId: number,
): Promise<GitHubInstallationToken> {
  const appJwt = generateAppJWT();

  const response = await fetch(
    `${GITHUB_API_BASE_URL}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${appJwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get installation access token: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getInstallation(installationId: number): Promise<GitHubAppInstallation> {
  const appJwt = generateAppJWT();

  const response = await fetch(
    `${GITHUB_API_BASE_URL}/app/installations/${installationId}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${appJwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get installation: ${response.status} ${errorText}`);
  }

  return response.json();
}

export function generateMiyabiSessionToken(user: MiyabiGitHubUser): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      userId: user.id,
      githubId: user.githubId,
      githubLogin: user.githubLogin,
      email: user.email,
      tier: user.tier,
    },
    jwtSecret,
    {
      expiresIn: '7d',
      issuer: 'miyabi-ai-agent-framework',
      audience: 'miyabi-users',
    },
  );
}

export interface MiyabiSessionPayload {
  userId: string;
  githubId: number;
  githubLogin: string;
  email: string | null;
  tier: 'free' | 'pro' | 'enterprise';
  iat: number;
  exp: number;
}

export function verifyMiyabiSessionToken(token: string): MiyabiSessionPayload | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    return jwt.verify(token, jwtSecret, {
      issuer: 'miyabi-ai-agent-framework',
      audience: 'miyabi-users',
    }) as MiyabiSessionPayload;
  } catch {
    return null;
  }
}
