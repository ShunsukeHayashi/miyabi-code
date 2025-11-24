"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ailyV1Tools = exports.ailyV1AppSkillStart = exports.ailyV1AppSkillList = exports.ailyV1AppSkillGet = exports.ailyV1AppKnowledgeAsk = exports.ailyV1AppDataAssetList = exports.ailyV1AppDataAssetTagList = exports.ailyV1AilySessionUpdate = exports.ailyV1AilySessionRunList = exports.ailyV1AilySessionRunGet = exports.ailyV1AilySessionRunCreate = exports.ailyV1AilySessionRunCancel = exports.ailyV1AilySessionGet = exports.ailyV1AilySessionDelete = exports.ailyV1AilySessionCreate = exports.ailyV1AilySessionAilyMessageList = exports.ailyV1AilySessionAilyMessageGet = exports.ailyV1AilySessionAilyMessageCreate = void 0;
const zod_1 = require("zod");
exports.ailyV1AilySessionAilyMessageCreate = {
    project: 'aily',
    name: 'aily.v1.ailySessionAilyMessage.create',
    sdkName: 'aily.v1.ailySessionAilyMessage.create',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/messages',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-aily-message-Send aily message-The API is used to send a message to a Feishu smart partner application; each message belongs to an active session',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            idempotent_id: zod_1.z
                .string()
                .describe('Idempotent id, the same idempotent id in the same session counts as a message, valid period 72h'),
            content_type: zod_1.z.string().describe('Message content type'),
            content: zod_1.z.string().describe('Message content'),
            file_ids: zod_1.z.array(zod_1.z.string()).describe('List of file IDs contained in the message').optional(),
            quote_message_id: zod_1.z.string().describe('Referred message ID').optional(),
            mentions: zod_1.z
                .array(zod_1.z.object({
                entity_id: zod_1.z.string().describe('Entity ID').optional(),
                identity_provider: zod_1.z.string().describe('Identity provider').optional(),
                key: zod_1.z.string().describe('Placeholder for @entity in message body').optional(),
                name: zod_1.z.string().describe('The name of the @entity').optional(),
                aily_id: zod_1.z.string().describe('ID under the Aily account system').optional(),
            }))
                .describe('@entity')
                .optional(),
        }),
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionAilyMessageGet = {
    project: 'aily',
    name: 'aily.v1.ailySessionAilyMessage.get',
    sdkName: 'aily.v1.ailySessionAilyMessage.get',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/messages/:aily_message_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-message-Get aily message-This API is used to obtain the detailed information of the message of a Feishu smart partner application; including the content of the message, the sender, and so on',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('Session ID'),
            aily_message_id: zod_1.z.string().describe('Message ID'),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionAilyMessageList = {
    project: 'aily',
    name: 'aily.v1.ailySessionAilyMessage.list',
    sdkName: 'aily.v1.ailySessionAilyMessage.list',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/messages',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-message-List aily messages-This API is used to list the details of the message under a session of a Feishu smart partner application; including the content of the message, the sender, etc',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('Page size').optional(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
            run_id: zod_1.z.string().describe('Run ID').optional(),
            with_partial_message: zod_1.z.boolean().describe('Return the message being generated').optional(),
        }),
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionCreate = {
    project: 'aily',
    name: 'aily.v1.ailySession.create',
    sdkName: 'aily.v1.ailySession.create',
    path: '/open-apis/aily/v1/sessions',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-aily-session-Create session-This API is used to create a session with a Feishu smart partner application; when the session is created successfully, you can send messages, create and run',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            channel_context: zod_1.z.string().describe('Channel context').optional(),
            metadata: zod_1.z.string().describe('Other transparent information').optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionDelete = {
    project: 'aily',
    name: 'aily.v1.ailySession.delete',
    sdkName: 'aily.v1.ailySession.delete',
    path: '/open-apis/aily/v1/sessions/:aily_session_id',
    httpMethod: 'DELETE',
    description: '[Feishu/Lark]-aily-session-Delete session-This API is used to delete a session with a Feishu Smart Partner application',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionGet = {
    project: 'aily',
    name: 'aily.v1.ailySession.get',
    sdkName: 'aily.v1.ailySession.get',
    path: '/open-apis/aily/v1/sessions/:aily_session_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-session-Get session-This API is used to obtain detailed information about a session with a Feishu smart partner application, including the state of the session, channel context, creation time, and so on',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionRunCancel = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.cancel',
    sdkName: 'aily.v1.ailySessionRun.cancel',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs/:run_id/cancel',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-aily-run-Cancel run-This API is used to cancel the run of a Feishu smart partner application',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID'), run_id: zod_1.z.string().describe('Run ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionRunCreate = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.create',
    sdkName: 'aily.v1.ailySessionRun.create',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-aily-run-Create run-This API is used to create a Run on a session of a Feishu Smart Partner application',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            app_id: zod_1.z.string().describe('App ID'),
            skill_id: zod_1.z.string().describe('Skill ID').optional(),
            skill_input: zod_1.z.string().describe('When specifying a skill ID, you can also specify a skill input').optional(),
            metadata: zod_1.z.string().describe('Other transparent information').optional(),
        }),
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionRunGet = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.get',
    sdkName: 'aily.v1.ailySessionRun.get',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs/:run_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-run-Get run-This API is used to obtain detailed information about the Run of a Feishu smart partner application, including the status of the run, the end time, and so on',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID'), run_id: zod_1.z.string().describe('Run ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionRunList = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.list',
    sdkName: 'aily.v1.ailySessionRun.list',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-run-List runs-This API is used to list the running details of a Feishu smart partner application; including status, end time, and so on',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('Page size').optional(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
        }),
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AilySessionUpdate = {
    project: 'aily',
    name: 'aily.v1.ailySession.update',
    sdkName: 'aily.v1.ailySession.update',
    path: '/open-apis/aily/v1/sessions/:aily_session_id',
    httpMethod: 'PUT',
    description: '[Feishu/Lark]-aily-session-Update session-This API is used to update information about a session with a Feishu Smart Partner application',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            channel_context: zod_1.z.string().describe('Channel context').optional(),
            metadata: zod_1.z.string().describe('Other transparent information').optional(),
        }),
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('Session ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AppDataAssetTagList = {
    project: 'aily',
    name: 'aily.v1.appDataAssetTag.list',
    sdkName: 'aily.v1.appDataAssetTag.list',
    path: '/open-apis/aily/v1/apps/:app_id/data_asset_tags',
    httpMethod: 'GET',
    description: "[Feishu/Lark]-aily-Data Knowledge-Data Knowledge Management-List Data Knowledge Tag-List Aily's data knowledge tags",
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('Paging parameters: paging size, default: 20, max: 100').optional(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
            keyword: zod_1.z.string().describe('Fuzzy matching classification name').optional(),
            data_asset_tag_ids: zod_1.z.array(zod_1.z.string()).describe('Fuzzy matching classification name').optional(),
        }),
        path: zod_1.z.object({ app_id: zod_1.z.string().describe('AppID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AppDataAssetList = {
    project: 'aily',
    name: 'aily.v1.appDataAsset.list',
    sdkName: 'aily.v1.appDataAsset.list',
    path: '/open-apis/aily/v1/apps/:app_id/data_assets',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-Data Knowledge-Data Knowledge Management-List Data Knowledges-Get the data knowledge list of the Aily',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('Paging parameters: paging size, default: 20, max: 100').optional(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
            keyword: zod_1.z.string().describe('Fuzzy matching keywords').optional(),
            data_asset_ids: zod_1.z.array(zod_1.z.string()).describe('Filtering by Data Knowledge ID').optional(),
            data_asset_tag_ids: zod_1.z.array(zod_1.z.string()).describe('Filtering by data knowledge classification ID').optional(),
            with_data_asset_item: zod_1.z.boolean().describe('Does the result include data and knowledge items?').optional(),
            with_connect_status: zod_1.z.boolean().describe('Does the result contain data connection status?').optional(),
        }),
        path: zod_1.z.object({
            app_id: zod_1.z
                .string()
                .describe("The APPID of the application of the Aily can be obtained directly from the URL of the Aily's application. Get an example:/ai/{APPID}"),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AppKnowledgeAsk = {
    project: 'aily',
    name: 'aily.v1.appKnowledge.ask',
    sdkName: 'aily.v1.appKnowledge.ask',
    path: '/open-apis/aily/v1/apps/:app_id/knowledges/ask',
    httpMethod: 'POST',
    description: "[Feishu/Lark]-aily-Data Knowledge-Execute Data-Knowledge Q&A-Ask Aily's Data Knowledge",
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            message: zod_1.z
                .object({ content: zod_1.z.string().describe('message content').optional() })
                .describe('Input message (currently only supports plain text input)'),
            data_asset_ids: zod_1.z
                .array(zod_1.z.string())
                .describe('The scope of data knowledge on which control knowledge question answering is based')
                .optional(),
            data_asset_tag_ids: zod_1.z
                .array(zod_1.z.string())
                .describe('The Scope of Data Knowledge Classification Based on Control Knowledge Question Answering')
                .optional(),
        }),
        path: zod_1.z.object({ app_id: zod_1.z.string().describe('AppID of Feishu Smart Partner Building Platform') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AppSkillGet = {
    project: 'aily',
    name: 'aily.v1.appSkill.get',
    sdkName: 'aily.v1.appSkill.get',
    path: '/open-apis/aily/v1/apps/:app_id/skills/:skill_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-skill-Get Skill-This API is used to query the specific skill details of an Aily application',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({
            app_id: zod_1.z
                .string()
                .describe('The Aily application ID (spring_xxx__c) can be obtained from the browser address of the Aily application development page'),
            skill_id: zod_1.z
                .string()
                .describe('Skill ID; can be obtained from the browser address bar on the Skill Edit page (skill_xxx)'),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AppSkillList = {
    project: 'aily',
    name: 'aily.v1.appSkill.list',
    sdkName: 'aily.v1.appSkill.list',
    path: '/open-apis/aily/v1/apps/:app_id/skills',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-aily-skill-List Skill-This API is used to query the skill list of an Aily application',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z
                .number()
                .describe('The number of message records obtained in this request, the default is 20')
                .optional(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
        }),
        path: zod_1.z.object({
            app_id: zod_1.z
                .string()
                .describe('The Aily application ID (spring_xxx__c) can be obtained from the browser address of the Aily application development page'),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1AppSkillStart = {
    project: 'aily',
    name: 'aily.v1.appSkill.start',
    sdkName: 'aily.v1.appSkill.start',
    path: '/open-apis/aily/v1/apps/:app_id/skills/:skill_id/start',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-aily-skill-Start Skill-The API is used to invoke a specific skill of an Aily application, supports specifying skill imported parameters; and returns the result of skill execution synchronously',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            global_variable: zod_1.z
                .object({
                query: zod_1.z
                    .string()
                    .describe('Message text that triggers skills; that is, what the user enters in a conversation on channels such as the Feishu bot')
                    .optional(),
                files: zod_1.z
                    .array(zod_1.z.string())
                    .describe("File information that triggers skills (such as image files that need to be consumed such as OCR nodes)> If the skill does not require a file, the'files' parameter can be passed empty")
                    .optional(),
                channel: zod_1.z
                    .object({
                    variables: zod_1.z
                        .string()
                        .describe('Custom incoming variables; can be consumed in Workflow skills global variables')
                        .optional(),
                })
                    .describe('Channel information')
                    .optional(),
            })
                .describe('Global Variables for Skills')
                .optional(),
            input: zod_1.z.string().describe('Custom variables for skills').optional(),
        }),
        path: zod_1.z.object({
            app_id: zod_1.z
                .string()
                .describe('The Aily application ID (spring_xxx__c) can be obtained from the browser address of the Aily application development page'),
            skill_id: zod_1.z
                .string()
                .describe('Skill ID; can be obtained from the browser address bar on the Skill Edit page (skill_xxx)'),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.ailyV1Tools = [
    exports.ailyV1AilySessionAilyMessageCreate,
    exports.ailyV1AilySessionAilyMessageGet,
    exports.ailyV1AilySessionAilyMessageList,
    exports.ailyV1AilySessionCreate,
    exports.ailyV1AilySessionDelete,
    exports.ailyV1AilySessionGet,
    exports.ailyV1AilySessionRunCancel,
    exports.ailyV1AilySessionRunCreate,
    exports.ailyV1AilySessionRunGet,
    exports.ailyV1AilySessionRunList,
    exports.ailyV1AilySessionUpdate,
    exports.ailyV1AppDataAssetTagList,
    exports.ailyV1AppDataAssetList,
    exports.ailyV1AppKnowledgeAsk,
    exports.ailyV1AppSkillGet,
    exports.ailyV1AppSkillList,
    exports.ailyV1AppSkillStart,
];
