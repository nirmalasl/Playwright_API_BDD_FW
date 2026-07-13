import { APIRequestContext, APIResponse } from '@playwright/test';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  /** POST /auth/login */
  async login(payload: LoginPayload): Promise<APIResponse> {
    return this.request.post('auth/login', { data: payload });
  }

  /** GET /auth/profile — requires Bearer token */
  async getProfile(accessToken: string): Promise<APIResponse> {
    return this.request.get('auth/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  /** POST /auth/refresh-token */
  async refreshToken(payload: RefreshTokenPayload): Promise<APIResponse> {
    return this.request.post('auth/refresh-token', { data: payload });
  }
}
