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
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-消息-发送智能伙伴消息-该 API 用于向某个飞书智能伙伴应用发送一条消息（Message）；每个消息从属于一个活跃的会话（Session）',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            idempotent_id: zod_1.z
                .string()
                .describe('幂等 ID（如使用 UUID 生成器或时间戳），同一会话下相同的幂等 ID 视为同一个消息（72h）'),
            content_type: zod_1.z
                .string()
                .describe('消息的类型，包括 `MDX` | `TEXT` 等- `MDX` 能够表达富文本信息结构，可参考 - `TEXT` 作为纯文本进行处理'),
            content: zod_1.z.string().describe('消息内容'),
            file_ids: zod_1.z.array(zod_1.z.string()).describe('消息中包含的文件 ID 列表').optional(),
            quote_message_id: zod_1.z.string().describe('引用的消息 ID').optional(),
            mentions: zod_1.z
                .array(zod_1.z.object({
                entity_id: zod_1.z.string().describe('实体 ID').optional(),
                identity_provider: zod_1.z.string().describe('身份提供者').optional(),
                key: zod_1.z.string().describe('被@实体在消息体中的占位符').optional(),
                name: zod_1.z.string().describe('被@实体的名称').optional(),
                aily_id: zod_1.z.string().describe('飞书智能伙伴创建平台账号体系下的 ID').optional(),
            }))
                .describe('被@的实体')
                .optional(),
        }),
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('会话 ID；参考  接口'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionAilyMessageGet = {
    project: 'aily',
    name: 'aily.v1.ailySessionAilyMessage.get',
    sdkName: 'aily.v1.ailySessionAilyMessage.get',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/messages/:aily_message_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-消息-获取智能伙伴消息-该 API 用于获取某个飞书智能伙伴应用的消息（Message）的详细信息；包括消息的内容、发送人等',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('会话 ID；参考  接口'),
            aily_message_id: zod_1.z.string().describe('消息 ID'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionAilyMessageList = {
    project: 'aily',
    name: 'aily.v1.ailySessionAilyMessage.list',
    sdkName: 'aily.v1.ailySessionAilyMessage.list',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/messages',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-消息-列出智能伙伴消息-该 API 用于列出某个飞书智能伙伴应用的某个会话（Session）下消息（Message）的详细信息；包括消息的内容、发送人等',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('本次请求获取的消息记录条数，默认 20').optional(),
            page_token: zod_1.z
                .string()
                .describe('分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果')
                .optional(),
            run_id: zod_1.z.string().describe('过滤条件，按执行的唯一 ID 筛选').optional(),
            with_partial_message: zod_1.z
                .boolean()
                .describe('是否返回正在进行中（即流式输出中）的消息内容- 当设置为 `true` 时，返回的消息记录中、每个消息将额外包含一个 `status `字段（`IN_PROGRESS` | `COMPLETED`），此时 `content` 字段为当前时刻的消息内容- 当设置为 `false` 时，返回的消息记录仅包含已完成的消息')
                .optional(),
        }),
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('会话 ID；参考  接口'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionCreate = {
    project: 'aily',
    name: 'aily.v1.ailySession.create',
    sdkName: 'aily.v1.ailySession.create',
    path: '/open-apis/aily/v1/sessions',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-会话-创建会话-该 API 用于创建与某个飞书智能伙伴应用的一次会话（Session）；当创建会话成功后，可以发送消息、创建运行',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            channel_context: zod_1.z.string().describe('可自行构造的 Context ；在 Workflow 技能中可消费这部分全局变量').optional(),
            metadata: zod_1.z
                .string()
                .describe('会话的自定义变量内容，变量数据保存在服务端 Session 中，可在 `GetSession` 时原样返回，无需在 API 调用侧存储')
                .optional(),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionDelete = {
    project: 'aily',
    name: 'aily.v1.ailySession.delete',
    sdkName: 'aily.v1.ailySession.delete',
    path: '/open-apis/aily/v1/sessions/:aily_session_id',
    httpMethod: 'DELETE',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-会话-删除会话-该 API 用于删除与某个飞书智能伙伴应用的一次会话（Session）',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('会话 ID') }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionGet = {
    project: 'aily',
    name: 'aily.v1.ailySession.get',
    sdkName: 'aily.v1.ailySession.get',
    path: '/open-apis/aily/v1/sessions/:aily_session_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-会话-获取会话-该 API 用于获取与某个飞书智能伙伴应用的一次会话（Session）的详细信息，包括会话的状态、渠道上下文、创建时间等',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('会话 ID') }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionRunCancel = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.cancel',
    sdkName: 'aily.v1.ailySessionRun.cancel',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs/:run_id/cancel',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-运行-取消运行-该 API 用于中止某个飞书智能伙伴的一次运行',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('会话 ID；参考  接口'),
            run_id: zod_1.z.string().describe('运行的唯一 ID'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionRunCreate = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.create',
    sdkName: 'aily.v1.ailySessionRun.create',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-运行-创建运行-该 API 用于在某个飞书智能伙伴应用会话（Session）上创建一次运行（Run）',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            app_id: zod_1.z.string().describe('为 Aily 应用 ID（`spring_xxx__c`），可以在 Aily 应用开发页面的浏览器地址里获取'),
            skill_id: zod_1.z
                .string()
                .describe('指定技能 ID（`skill_xxx`），可以在 Aily 技能配置页面的浏览器地址里获取> 指定技能后、能够节省意图匹配的耗时')
                .optional(),
            skill_input: zod_1.z
                .string()
                .describe('指定技能 ID 时可以同时指定技能输入> 备注：常用于工作流技能内指定自定义参数，`skill_input` 需要配合 `skill_id` 同时传递才能生效')
                .optional(),
            metadata: zod_1.z
                .string()
                .describe('其他扩展的参数（JSON String）> 备注：`metadata` 传递的参数，可以在后续 `GetRun` 调用中原样读取获得')
                .optional(),
        }),
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('会话 ID；参考  接口'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionRunGet = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.get',
    sdkName: 'aily.v1.ailySessionRun.get',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs/:run_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-运行-获取运行-该 API 用于获取某个飞书智能伙伴应用的运行（Run）的详细信息；包括运行的状态、结束时间等',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('会话 ID；参考  接口'),
            run_id: zod_1.z.string().describe('运行的唯一 ID'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionRunList = {
    project: 'aily',
    name: 'aily.v1.ailySessionRun.list',
    sdkName: 'aily.v1.ailySessionRun.list',
    path: '/open-apis/aily/v1/sessions/:aily_session_id/runs',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-运行-列出运行-该 API 用于列出某个飞书智能伙伴应用的运行（Run）的详细信息；包括状态、结束时间等',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('本次请求获取的运行记录条数，默认 20').optional(),
            page_token: zod_1.z
                .string()
                .describe('分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果')
                .optional(),
        }),
        path: zod_1.z.object({
            aily_session_id: zod_1.z.string().describe('会话 ID；参考  接口'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AilySessionUpdate = {
    project: 'aily',
    name: 'aily.v1.ailySession.update',
    sdkName: 'aily.v1.ailySession.update',
    path: '/open-apis/aily/v1/sessions/:aily_session_id',
    httpMethod: 'PUT',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-会话-更新会话-该 API 用于更新与某个飞书智能伙伴应用的一次会话（Session）的信息',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            channel_context: zod_1.z.string().describe('可自行构造的 Context ；在 Workflow 技能中可消费这部分全局变量').optional(),
            metadata: zod_1.z
                .string()
                .describe('会话的自定义变量内容，变量数据保存在服务端 Session 中，可在 `GetSession` 时原样返回，无需在 API 调用侧存储')
                .optional(),
        }),
        path: zod_1.z.object({ aily_session_id: zod_1.z.string().describe('会话 ID') }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AppDataAssetTagList = {
    project: 'aily',
    name: 'aily.v1.appDataAssetTag.list',
    sdkName: 'aily.v1.appDataAssetTag.list',
    path: '/open-apis/aily/v1/apps/:app_id/data_asset_tags',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-知识问答-数据知识管理-获取数据知识分类列表-获取智能伙伴搭建助手的数据知识分类列表',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('分页参数：分页大小，默认：20，最大：100').optional(),
            page_token: zod_1.z
                .string()
                .describe('分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果')
                .optional(),
            keyword: zod_1.z.string().describe('模糊匹配分类名称').optional(),
            data_asset_tag_ids: zod_1.z.array(zod_1.z.string()).describe('模糊匹配分类名称').optional(),
        }),
        path: zod_1.z.object({ app_id: zod_1.z.string().describe('AppID') }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AppDataAssetList = {
    project: 'aily',
    name: 'aily.v1.appDataAsset.list',
    sdkName: 'aily.v1.appDataAsset.list',
    path: '/open-apis/aily/v1/apps/:app_id/data_assets',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-知识问答-数据知识管理-查询数据知识列表-获取智能伙伴搭建助手的数据知识列表',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('分页参数：分页大小，默认：20，最大：100').optional(),
            page_token: zod_1.z
                .string()
                .describe('分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果')
                .optional(),
            keyword: zod_1.z.string().describe('模糊匹配关键词').optional(),
            data_asset_ids: zod_1.z.array(zod_1.z.string()).describe('根据数据知识 ID 进行过滤').optional(),
            data_asset_tag_ids: zod_1.z.array(zod_1.z.string()).describe('根据数据知识分类 ID 进行过滤').optional(),
            with_data_asset_item: zod_1.z.boolean().describe('结果是否包含数据与知识项目').optional(),
            with_connect_status: zod_1.z.boolean().describe('结果是否包含数据连接状态').optional(),
        }),
        path: zod_1.z.object({
            app_id: zod_1.z
                .string()
                .describe('智能伙伴创建平台的应用的APPID，可以直接从智能伙伴应用的URL中获取。获取示例：/ai/{APPID}'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AppKnowledgeAsk = {
    project: 'aily',
    name: 'aily.v1.appKnowledge.ask',
    sdkName: 'aily.v1.appKnowledge.ask',
    path: '/open-apis/aily/v1/apps/:app_id/knowledges/ask',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-知识问答-执行数据知识问答-执行飞书智能伙伴的数据知识问答',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            message: zod_1.z
                .object({ content: zod_1.z.string().describe('消息内容').optional() })
                .describe('输入消息（当前仅支持纯文本输入）'),
            data_asset_ids: zod_1.z.array(zod_1.z.string()).describe('控制知识问答所依据的数据知识范围').optional(),
            data_asset_tag_ids: zod_1.z.array(zod_1.z.string()).describe('控制知识问答所依据的数据知识分类范围').optional(),
        }),
        path: zod_1.z.object({ app_id: zod_1.z.string().describe('飞书智能伙伴搭建平台的AppID') }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AppSkillGet = {
    project: 'aily',
    name: 'aily.v1.appSkill.get',
    sdkName: 'aily.v1.appSkill.get',
    path: '/open-apis/aily/v1/apps/:app_id/skills/:skill_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-技能-获取技能信息-该 API 用于查询某个 Aily 应用的特定技能详情',
    accessTokens: ['tenant', 'user'],
    schema: {
        path: zod_1.z.object({
            app_id: zod_1.z.string().describe('Aily 应用 ID（`spring_xxx__c`），可以在 Aily 应用开发页面的浏览器地址里获取'),
            skill_id: zod_1.z.string().describe('技能 ID；可通过技能编辑页面的浏览器地址栏获取（`skill_xxx`）'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AppSkillList = {
    project: 'aily',
    name: 'aily.v1.appSkill.list',
    sdkName: 'aily.v1.appSkill.list',
    path: '/open-apis/aily/v1/apps/:app_id/skills',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-技能-查询技能列表-该 API 用于查询某个 Aily 应用的技能列表> 包括内置的数据分析与问答技能、以及未在对话开启的技能',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('本次请求获取的消息记录条数，默认 20').optional(),
            page_token: zod_1.z
                .string()
                .describe('分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果')
                .optional(),
        }),
        path: zod_1.z.object({
            app_id: zod_1.z.string().describe('Aily 应用 ID（`spring_xxx__c`），可以在 Aily 应用开发页面的浏览器地址里获取'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
    },
};
exports.ailyV1AppSkillStart = {
    project: 'aily',
    name: 'aily.v1.appSkill.start',
    sdkName: 'aily.v1.appSkill.start',
    path: '/open-apis/aily/v1/apps/:app_id/skills/:skill_id/start',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-飞书智能伙伴创建平台-技能-调用技能-该 API 用于调用某个 Aily 应用的特定技能，支持指定技能入参；并同步返回技能执行的结果',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            global_variable: zod_1.z
                .object({
                query: zod_1.z.string().describe('触发技能的消息文本；即用户在飞书机器人等渠道**对话输入的内容**').optional(),
                files: zod_1.z
                    .array(zod_1.z.string())
                    .describe('触发技能的文件信息（如 OCR 节点等所需消费的图片文件）> 如技能不需要文件，`files` 参数传空即可')
                    .optional(),
                channel: zod_1.z
                    .object({ variables: zod_1.z.string().describe('自定义传入的变量；可在 Workflow 技能全局变量中消费').optional() })
                    .describe('渠道信息')
                    .optional(),
            })
                .describe('技能的全局变量')
                .optional(),
            input: zod_1.z.string().describe('技能的自定义变量').optional(),
        }),
        path: zod_1.z.object({
            app_id: zod_1.z.string().describe('Aily 应用 ID（`spring_xxx__c`），可以在 Aily 应用开发页面的浏览器地址里获取'),
            skill_id: zod_1.z.string().describe('技能 ID；可通过技能编辑页面的浏览器地址栏获取（`skill_xxx`）'),
        }),
        useUAT: zod_1.z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
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
