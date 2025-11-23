import { z } from 'zod';
export type ailyV1ToolName = 'aily.v1.ailySessionAilyMessage.create' | 'aily.v1.ailySessionAilyMessage.get' | 'aily.v1.ailySessionAilyMessage.list' | 'aily.v1.ailySession.create' | 'aily.v1.ailySession.delete' | 'aily.v1.ailySession.get' | 'aily.v1.ailySessionRun.cancel' | 'aily.v1.ailySessionRun.create' | 'aily.v1.ailySessionRun.get' | 'aily.v1.ailySessionRun.list' | 'aily.v1.ailySession.update' | 'aily.v1.appDataAssetTag.list' | 'aily.v1.appDataAsset.list' | 'aily.v1.appKnowledge.ask' | 'aily.v1.appSkill.get' | 'aily.v1.appSkill.list' | 'aily.v1.appSkill.start';
export declare const ailyV1AilySessionAilyMessageCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            idempotent_id: z.ZodString;
            content_type: z.ZodString;
            content: z.ZodString;
            file_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            quote_message_id: z.ZodOptional<z.ZodString>;
            mentions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                entity_id: z.ZodOptional<z.ZodString>;
                identity_provider: z.ZodOptional<z.ZodString>;
                key: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
                aily_id: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                key?: string | undefined;
                name?: string | undefined;
                entity_id?: string | undefined;
                identity_provider?: string | undefined;
                aily_id?: string | undefined;
            }, {
                key?: string | undefined;
                name?: string | undefined;
                entity_id?: string | undefined;
                identity_provider?: string | undefined;
                aily_id?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            content: string;
            idempotent_id: string;
            content_type: string;
            file_ids?: string[] | undefined;
            quote_message_id?: string | undefined;
            mentions?: {
                key?: string | undefined;
                name?: string | undefined;
                entity_id?: string | undefined;
                identity_provider?: string | undefined;
                aily_id?: string | undefined;
            }[] | undefined;
        }, {
            content: string;
            idempotent_id: string;
            content_type: string;
            file_ids?: string[] | undefined;
            quote_message_id?: string | undefined;
            mentions?: {
                key?: string | undefined;
                name?: string | undefined;
                entity_id?: string | undefined;
                identity_provider?: string | undefined;
                aily_id?: string | undefined;
            }[] | undefined;
        }>;
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionAilyMessageGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
            aily_message_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
            aily_message_id: string;
        }, {
            aily_session_id: string;
            aily_message_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionAilyMessageList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            page_size: z.ZodOptional<z.ZodNumber>;
            page_token: z.ZodOptional<z.ZodString>;
            run_id: z.ZodOptional<z.ZodString>;
            with_partial_message: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page_token?: string | undefined;
            run_id?: string | undefined;
            with_partial_message?: boolean | undefined;
        }, {
            page_size?: number | undefined;
            page_token?: string | undefined;
            run_id?: string | undefined;
            with_partial_message?: boolean | undefined;
        }>;
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            channel_context: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            metadata?: string | undefined;
            channel_context?: string | undefined;
        }, {
            metadata?: string | undefined;
            channel_context?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionDelete: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionRunCancel: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
            run_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
            run_id: string;
        }, {
            aily_session_id: string;
            run_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionRunCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            app_id: z.ZodString;
            skill_id: z.ZodOptional<z.ZodString>;
            skill_input: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
            metadata?: string | undefined;
            skill_id?: string | undefined;
            skill_input?: string | undefined;
        }, {
            app_id: string;
            metadata?: string | undefined;
            skill_id?: string | undefined;
            skill_input?: string | undefined;
        }>;
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionRunGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
            run_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
            run_id: string;
        }, {
            aily_session_id: string;
            run_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionRunList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            page_size: z.ZodOptional<z.ZodNumber>;
            page_token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }>;
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AilySessionUpdate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            channel_context: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            metadata?: string | undefined;
            channel_context?: string | undefined;
        }, {
            metadata?: string | undefined;
            channel_context?: string | undefined;
        }>;
        path: z.ZodObject<{
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AppDataAssetTagList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            page_size: z.ZodOptional<z.ZodNumber>;
            page_token: z.ZodOptional<z.ZodString>;
            keyword: z.ZodOptional<z.ZodString>;
            data_asset_tag_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page_token?: string | undefined;
            keyword?: string | undefined;
            data_asset_tag_ids?: string[] | undefined;
        }, {
            page_size?: number | undefined;
            page_token?: string | undefined;
            keyword?: string | undefined;
            data_asset_tag_ids?: string[] | undefined;
        }>;
        path: z.ZodObject<{
            app_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
        }, {
            app_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AppDataAssetList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            page_size: z.ZodOptional<z.ZodNumber>;
            page_token: z.ZodOptional<z.ZodString>;
            keyword: z.ZodOptional<z.ZodString>;
            data_asset_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            data_asset_tag_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            with_data_asset_item: z.ZodOptional<z.ZodBoolean>;
            with_connect_status: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page_token?: string | undefined;
            keyword?: string | undefined;
            data_asset_tag_ids?: string[] | undefined;
            data_asset_ids?: string[] | undefined;
            with_data_asset_item?: boolean | undefined;
            with_connect_status?: boolean | undefined;
        }, {
            page_size?: number | undefined;
            page_token?: string | undefined;
            keyword?: string | undefined;
            data_asset_tag_ids?: string[] | undefined;
            data_asset_ids?: string[] | undefined;
            with_data_asset_item?: boolean | undefined;
            with_connect_status?: boolean | undefined;
        }>;
        path: z.ZodObject<{
            app_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
        }, {
            app_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AppKnowledgeAsk: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            message: z.ZodObject<{
                content: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                content?: string | undefined;
            }, {
                content?: string | undefined;
            }>;
            data_asset_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            data_asset_tag_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            message: {
                content?: string | undefined;
            };
            data_asset_tag_ids?: string[] | undefined;
            data_asset_ids?: string[] | undefined;
        }, {
            message: {
                content?: string | undefined;
            };
            data_asset_tag_ids?: string[] | undefined;
            data_asset_ids?: string[] | undefined;
        }>;
        path: z.ZodObject<{
            app_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
        }, {
            app_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AppSkillGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            app_id: z.ZodString;
            skill_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
            skill_id: string;
        }, {
            app_id: string;
            skill_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AppSkillList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            page_size: z.ZodOptional<z.ZodNumber>;
            page_token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }>;
        path: z.ZodObject<{
            app_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
        }, {
            app_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1AppSkillStart: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            global_variable: z.ZodOptional<z.ZodObject<{
                query: z.ZodOptional<z.ZodString>;
                files: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                channel: z.ZodOptional<z.ZodObject<{
                    variables: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    variables?: string | undefined;
                }, {
                    variables?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                query?: string | undefined;
                files?: string[] | undefined;
                channel?: {
                    variables?: string | undefined;
                } | undefined;
            }, {
                query?: string | undefined;
                files?: string[] | undefined;
                channel?: {
                    variables?: string | undefined;
                } | undefined;
            }>>;
            input: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            global_variable?: {
                query?: string | undefined;
                files?: string[] | undefined;
                channel?: {
                    variables?: string | undefined;
                } | undefined;
            } | undefined;
            input?: string | undefined;
        }, {
            global_variable?: {
                query?: string | undefined;
                files?: string[] | undefined;
                channel?: {
                    variables?: string | undefined;
                } | undefined;
            } | undefined;
            input?: string | undefined;
        }>;
        path: z.ZodObject<{
            app_id: z.ZodString;
            skill_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
            skill_id: string;
        }, {
            app_id: string;
            skill_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const ailyV1Tools: ({
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            channel_context: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            metadata?: string | undefined;
            channel_context?: string | undefined;
        }, {
            metadata?: string | undefined;
            channel_context?: string | undefined;
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
            aily_session_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            aily_session_id: string;
        }, {
            aily_session_id: string;
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
        data: z.ZodObject<{
            message: z.ZodObject<{
                content: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                content?: string | undefined;
            }, {
                content?: string | undefined;
            }>;
            data_asset_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            data_asset_tag_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            message: {
                content?: string | undefined;
            };
            data_asset_tag_ids?: string[] | undefined;
            data_asset_ids?: string[] | undefined;
        }, {
            message: {
                content?: string | undefined;
            };
            data_asset_tag_ids?: string[] | undefined;
            data_asset_ids?: string[] | undefined;
        }>;
        path: z.ZodObject<{
            app_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
        }, {
            app_id: string;
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
            app_id: z.ZodString;
            skill_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
            skill_id: string;
        }, {
            app_id: string;
            skill_id: string;
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
        params: z.ZodObject<{
            page_size: z.ZodOptional<z.ZodNumber>;
            page_token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }>;
        path: z.ZodObject<{
            app_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            app_id: string;
        }, {
            app_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
})[];
