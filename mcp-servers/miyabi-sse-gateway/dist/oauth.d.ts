import { Request, Response } from 'express';
export declare const oauthAuthorize: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const oauthAuthorizePost: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const oauthToken: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const getOAuthConfig: () => {
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string[];
};
