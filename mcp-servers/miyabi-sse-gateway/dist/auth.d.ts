import { Request, Response, NextFunction } from 'express';
export declare function generateApiKey(): string;
export declare function apiKeyAuth(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function bearerAuth(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
interface OAuth2Token {
    access_token: string;
    token_type: string;
    expires_in: number;
}
export declare function generateOAuth2Token(userId: string): OAuth2Token;
export declare function validateOAuth2Token(token: string): string | null;
export declare function oauth2Middleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export {};
