import { z } from 'zod';
export type minutesV1ToolName = 'minutes.v1.minute.get' | 'minutes.v1.minuteMedia.get' | 'minutes.v1.minuteStatistics.get';
export declare const minutesV1MinuteGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            user_id_type: z.ZodOptional<z.ZodEnum<["open_id", "union_id", "user_id"]>>;
        }, "strip", z.ZodTypeAny, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }>;
        path: z.ZodObject<{
            minute_token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            minute_token?: string | undefined;
        }, {
            minute_token?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const minutesV1MinuteMediaGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            minute_token: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            minute_token: string;
        }, {
            minute_token: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const minutesV1MinuteStatisticsGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            user_id_type: z.ZodOptional<z.ZodEnum<["open_id", "union_id", "user_id"]>>;
        }, "strip", z.ZodTypeAny, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }>;
        path: z.ZodObject<{
            minute_token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            minute_token?: string | undefined;
        }, {
            minute_token?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const minutesV1Tools: ({
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            user_id_type: z.ZodOptional<z.ZodEnum<["open_id", "union_id", "user_id"]>>;
        }, "strip", z.ZodTypeAny, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }>;
        path: z.ZodObject<{
            minute_token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            minute_token?: string | undefined;
        }, {
            minute_token?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
} | {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            minute_token: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            minute_token: string;
        }, {
            minute_token: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
})[];
