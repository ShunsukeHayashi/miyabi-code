import { Request, Response, NextFunction } from 'express';
export interface InjectionCheckResult {
    isSafe: boolean;
    threat: string | null;
    pattern: string | null;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export declare function checkPromptInjection(text: string): InjectionCheckResult;
export declare const promptInjectionGuard: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
