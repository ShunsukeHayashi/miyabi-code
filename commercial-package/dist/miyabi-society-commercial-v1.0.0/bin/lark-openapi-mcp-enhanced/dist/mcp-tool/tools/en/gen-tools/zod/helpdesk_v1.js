"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpdeskV1Tools = exports.helpdeskV1TicketUpdate = exports.helpdeskV1TicketStartService = exports.helpdeskV1TicketMessageList = exports.helpdeskV1TicketMessageCreate = exports.helpdeskV1TicketList = exports.helpdeskV1TicketGet = exports.helpdeskV1TicketCustomizedFields = exports.helpdeskV1TicketAnswerUserQuery = exports.helpdeskV1TicketCustomizedFieldPatch = exports.helpdeskV1TicketCustomizedFieldList = exports.helpdeskV1TicketCustomizedFieldGet = exports.helpdeskV1TicketCustomizedFieldDelete = exports.helpdeskV1TicketCustomizedFieldCreate = exports.helpdeskV1NotificationSubmitApprove = exports.helpdeskV1NotificationPreview = exports.helpdeskV1NotificationPatch = exports.helpdeskV1NotificationGet = exports.helpdeskV1NotificationExecuteSend = exports.helpdeskV1NotificationCreate = exports.helpdeskV1NotificationCancelSend = exports.helpdeskV1NotificationCancelApprove = exports.helpdeskV1FaqSearch = exports.helpdeskV1FaqPatch = exports.helpdeskV1FaqList = exports.helpdeskV1FaqGet = exports.helpdeskV1FaqDelete = exports.helpdeskV1FaqCreate = exports.helpdeskV1EventUnsubscribe = exports.helpdeskV1EventSubscribe = exports.helpdeskV1CategoryPatch = exports.helpdeskV1CategoryList = exports.helpdeskV1CategoryGet = exports.helpdeskV1CategoryDelete = exports.helpdeskV1CategoryCreate = exports.helpdeskV1BotMessageCreate = exports.helpdeskV1AgentSchedulesPatch = exports.helpdeskV1AgentSchedulesGet = exports.helpdeskV1AgentSchedulesDelete = exports.helpdeskV1AgentPatch = exports.helpdeskV1AgentAgentEmail = exports.helpdeskV1AgentSkillPatch = exports.helpdeskV1AgentSkillList = exports.helpdeskV1AgentSkillGet = exports.helpdeskV1AgentSkillDelete = exports.helpdeskV1AgentSkillCreate = exports.helpdeskV1AgentSkillRuleList = exports.helpdeskV1AgentScheduleList = exports.helpdeskV1AgentScheduleCreate = void 0;
const zod_1 = require("zod");
exports.helpdeskV1AgentScheduleCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSchedule.create',
    sdkName: 'helpdesk.v1.agentSchedule.create',
    path: '/open-apis/helpdesk/v1/agent_schedules',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent schedule-Create an agent-This API is used to create an agent',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            agent_schedules: zod_1.z
                .array(zod_1.z.object({
                agent_id: zod_1.z.string().describe('Agent ID').optional(),
                schedule: zod_1.z
                    .array(zod_1.z.object({
                    start_time: zod_1.z.string().describe('Start time, format 00:00 – 23:59').optional(),
                    end_time: zod_1.z.string().describe('End time, format 00:00 – 23:59').optional(),
                    weekday: zod_1.z
                        .number()
                        .describe('Day of the week, 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday, 7 - Sunday, 9 - Everyday, 10 - Weekday, 11 - Weekend')
                        .optional(),
                }))
                    .describe('Work schedule list')
                    .optional(),
                agent_skill_ids: zod_1.z.array(zod_1.z.string()).describe('Skill IDs').optional(),
            }))
                .describe('New agent schedule')
                .optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1AgentScheduleList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSchedule.list',
    sdkName: 'helpdesk.v1.agentSchedule.list',
    path: '/open-apis/helpdesk/v1/agent_schedules',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent schedule-List agent schedule-This API is used to obtain all agent information',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            status: zod_1.z
                .array(zod_1.z.number())
                .describe('Filter condition- 1: online agent- 2: offline (manual) agent- 3: off duty agent- 4: removed agentThe format for passing multiple values in a GET request is `status=1&status=2`'),
        }),
    },
};
exports.helpdeskV1AgentSkillRuleList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSkillRule.list',
    sdkName: 'helpdesk.v1.agentSkillRule.list',
    path: '/open-apis/helpdesk/v1/agent_skill_rules',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent skill rule-Obtain the skill list-This API is used to obtain all skills. Only available for custom apps',
    accessTokens: ['tenant'],
    schema: {},
};
exports.helpdeskV1AgentSkillCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSkill.create',
    sdkName: 'helpdesk.v1.agentSkill.create',
    path: '/open-apis/helpdesk/v1/agent_skills',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent skill-Create skills-This API is used to create agent skills',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            name: zod_1.z.string().describe('Skill name').optional(),
            rules: zod_1.z
                .array(zod_1.z.object({
                id: zod_1.z.string().describe('Rule ID. See  for how to obtain the rules options').optional(),
                selected_operator: zod_1.z.number().describe('Operator compare. See ').optional(),
                operand: zod_1.z.string().describe('Rule operand value').optional(),
                category: zod_1.z
                    .number()
                    .describe("Rule type, 1 - FAQs, 2 - Ticket information, 3 - User's Feishu information")
                    .optional(),
            }))
                .describe('Skill rules')
                .optional(),
            agent_ids: zod_1.z.array(zod_1.z.string()).describe('Agent IDs').optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1AgentSkillDelete = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSkill.delete',
    sdkName: 'helpdesk.v1.agentSkill.delete',
    path: '/open-apis/helpdesk/v1/agent_skills/:agent_skill_id',
    httpMethod: 'DELETE',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent skill-Delete agent skills-This API is used to delete agent skills',
    accessTokens: ['user'],
    schema: {
        path: zod_1.z.object({ agent_skill_id: zod_1.z.string().describe('agent group id').optional() }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1AgentSkillGet = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSkill.get',
    sdkName: 'helpdesk.v1.agentSkill.get',
    path: '/open-apis/helpdesk/v1/agent_skills/:agent_skill_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent skill-Obtain skills-This API is used to obtain skills',
    accessTokens: ['tenant'],
    schema: {
        path: zod_1.z.object({ agent_skill_id: zod_1.z.string().describe('agent skill id').optional() }),
    },
};
exports.helpdeskV1AgentSkillList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSkill.list',
    sdkName: 'helpdesk.v1.agentSkill.list',
    path: '/open-apis/helpdesk/v1/agent_skills',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent skill-Obtain all skills-Obtain all skills',
    accessTokens: ['tenant'],
    schema: {},
};
exports.helpdeskV1AgentSkillPatch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSkill.patch',
    sdkName: 'helpdesk.v1.agentSkill.patch',
    path: '/open-apis/helpdesk/v1/agent_skills/:agent_skill_id',
    httpMethod: 'PATCH',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent skill-Update agent skills-This API is used to update agent skills',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            agent_skill: zod_1.z
                .object({
                name: zod_1.z.string().describe('Skill name').optional(),
                rules: zod_1.z
                    .array(zod_1.z.object({
                    id: zod_1.z.string().describe('Rule ID. See  for how to obtain the rules options').optional(),
                    selected_operator: zod_1.z.number().describe('Operator compare. See ').optional(),
                    operator_options: zod_1.z.array(zod_1.z.number()).describe('Rule operand value. See ').optional(),
                    operand: zod_1.z.string().describe('Rule operand value').optional(),
                }))
                    .describe('Skill rules')
                    .optional(),
                agent_ids: zod_1.z.array(zod_1.z.string()).describe('Agent IDs with this skill').optional(),
            })
                .describe('Update skills')
                .optional(),
        }),
        path: zod_1.z.object({ agent_skill_id: zod_1.z.string().describe('agent skill id') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1AgentAgentEmail = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agent.agentEmail',
    sdkName: 'helpdesk.v1.agent.agentEmail',
    path: '/open-apis/helpdesk/v1/agent_emails',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent management-Obtain the agent email address-This API is used to obtain the agent email address',
    accessTokens: ['tenant'],
    schema: {},
};
exports.helpdeskV1AgentPatch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agent.patch',
    sdkName: 'helpdesk.v1.agent.patch',
    path: '/open-apis/helpdesk/v1/agents/:agent_id',
    httpMethod: 'PATCH',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent management-Update agent information-Update information such as the agent status',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({ status: zod_1.z.number().describe('agent status, 1: Online; 2: Offline').optional() }),
        path: zod_1.z.object({ agent_id: zod_1.z.string().describe('Agent ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1AgentSchedulesDelete = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSchedules.delete',
    sdkName: 'helpdesk.v1.agentSchedules.delete',
    path: '/open-apis/helpdesk/v1/agents/:agent_id/schedules',
    httpMethod: 'DELETE',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent schedule-Delete an agent-This API is used to delete the agent',
    accessTokens: ['user'],
    schema: {
        path: zod_1.z.object({ agent_id: zod_1.z.string().describe('agent user id').optional() }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1AgentSchedulesGet = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSchedules.get',
    sdkName: 'helpdesk.v1.agentSchedules.get',
    path: '/open-apis/helpdesk/v1/agents/:agent_id/schedules',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent schedule-Obtain work schedules of agents-This API is used to obtain agent information',
    accessTokens: ['tenant'],
    schema: {
        path: zod_1.z.object({ agent_id: zod_1.z.string().describe('Agent ID') }),
    },
};
exports.helpdeskV1AgentSchedulesPatch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.agentSchedules.patch',
    sdkName: 'helpdesk.v1.agentSchedules.patch',
    path: '/open-apis/helpdesk/v1/agents/:agent_id/schedules',
    httpMethod: 'PATCH',
    description: '[Feishu/Lark]-Help Desk-Agent-Agent schedule-Update the agent schedule-This API is used to update the agent schedule',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            agent_schedule: zod_1.z
                .object({
                schedule: zod_1.z
                    .array(zod_1.z.object({
                    start_time: zod_1.z.string().describe('Start time, format 00:00 – 23:59').optional(),
                    end_time: zod_1.z.string().describe('End time, format 00:00 – 23:59').optional(),
                    weekday: zod_1.z
                        .number()
                        .describe('Day of the week, 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday, 7 - Sunday, 9 - Everyday, 10 - Weekday, 11 - Weekend')
                        .optional(),
                }))
                    .describe('Work schedule list')
                    .optional(),
                agent_skill_ids: zod_1.z.array(zod_1.z.string()).describe('Skill IDs').optional(),
            })
                .describe('Work schedule list')
                .optional(),
        }),
        path: zod_1.z.object({ agent_id: zod_1.z.string().describe('Agent ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1BotMessageCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.botMessage.create',
    sdkName: 'helpdesk.v1.botMessage.create',
    path: '/open-apis/helpdesk/v1/message',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket message-Help Desk bots send messages-Use the Help Desk bot to send a message to a Help Desk dedicated group or private chat of a specified user, such as text, rich text, cards, and images',
    accessTokens: ['tenant'],
    schema: {
        data: zod_1.z.object({
            msg_type: zod_1.z
                .enum(['text', 'post', 'image', 'interactive'])
                .describe('Message type Options:text(Plain text),post(Rich text),image(Image),interactive(Card message)'),
            content: zod_1.z
                .string()
                .describe('Message content, JSON structure serialized to string. For format description, refer to '),
            receiver_id: zod_1.z.string().describe('User ID of the message recipient'),
            receive_type: zod_1.z
                .enum(['chat', 'user'])
                .describe('Message receiving type, chat (Help Desk dedicated service group) or user (Help Desk bot private chat). If a dedicated service group is selected, a ticket that is being processed by the user will fail to be sent. It is sent as chat by default. Options:chat(Send via Help Desk dedicated group),user(Send to a private chat using the Help Desk bot)')
                .optional(),
        }),
        params: zod_1.z.object({ user_id_type: zod_1.z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() }),
    },
};
exports.helpdeskV1CategoryCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.category.create',
    sdkName: 'helpdesk.v1.category.create',
    path: '/open-apis/helpdesk/v1/categories',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-FAQ-Category-Create FAQs categories-This API is used to create FAQs categories',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            name: zod_1.z.string().describe('Name'),
            parent_id: zod_1.z.string().describe('Parent FAQs category ID'),
            language: zod_1.z.string().describe('Language').optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1CategoryDelete = {
    project: 'helpdesk',
    name: 'helpdesk.v1.category.delete',
    sdkName: 'helpdesk.v1.category.delete',
    path: '/open-apis/helpdesk/v1/categories/:id',
    httpMethod: 'DELETE',
    description: '[Feishu/Lark]-Help Desk-FAQ-Category-Delete FAQs category details-This API is used to delete FAQs category details',
    accessTokens: ['user'],
    schema: {
        path: zod_1.z.object({ id: zod_1.z.string().describe('FAQs category ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1CategoryGet = {
    project: 'helpdesk',
    name: 'helpdesk.v1.category.get',
    sdkName: 'helpdesk.v1.category.get',
    path: '/open-apis/helpdesk/v1/categories/:id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-FAQ-Category-Obtain FAQs categories-This API is used to obtain FAQs categories',
    accessTokens: ['tenant'],
    schema: {
        path: zod_1.z.object({ id: zod_1.z.string().describe('FAQs category ID') }),
    },
};
exports.helpdeskV1CategoryList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.category.list',
    sdkName: 'helpdesk.v1.category.list',
    path: '/open-apis/helpdesk/v1/categories',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-FAQ-Category-Obtain all FAQs categories-list all categories',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            lang: zod_1.z.string().describe('Knowledge base classification language').optional(),
            order_by: zod_1.z
                .number()
                .describe('Sort key. 1: Sort according to the knowledge base classification update time')
                .optional(),
            asc: zod_1.z.boolean().describe('Sequence. true: positive order; false: inverse order').optional(),
        }),
    },
};
exports.helpdeskV1CategoryPatch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.category.patch',
    sdkName: 'helpdesk.v1.category.patch',
    path: '/open-apis/helpdesk/v1/categories/:id',
    httpMethod: 'PATCH',
    description: '[Feishu/Lark]-Help Desk-FAQ-Category-Update FAQs category details-This API is used to update FAQs category details',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            name: zod_1.z.string().describe('Name').optional(),
            parent_id: zod_1.z.string().describe('Parent FAQs category ID').optional(),
        }),
        path: zod_1.z.object({ id: zod_1.z.string().describe('category id') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1EventSubscribe = {
    project: 'helpdesk',
    name: 'helpdesk.v1.event.subscribe',
    sdkName: 'helpdesk.v1.event.subscribe',
    path: '/open-apis/helpdesk/v1/events/subscribe',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Event-Subscribe to Help Desk events-Used for subscribing to Help Desk events',
    accessTokens: ['tenant'],
    schema: {
        data: zod_1.z.object({
            events: zod_1.z
                .array(zod_1.z.object({ type: zod_1.z.string().describe('Event type'), subtype: zod_1.z.string().describe('Event subtype') }))
                .describe('List of subscribable events'),
        }),
    },
};
exports.helpdeskV1EventUnsubscribe = {
    project: 'helpdesk',
    name: 'helpdesk.v1.event.unsubscribe',
    sdkName: 'helpdesk.v1.event.unsubscribe',
    path: '/open-apis/helpdesk/v1/events/unsubscribe',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Event-Unsubscribe Help Desk events-Used for unsubscribing Help Desk events',
    accessTokens: ['tenant'],
    schema: {
        data: zod_1.z.object({
            events: zod_1.z
                .array(zod_1.z.object({ type: zod_1.z.string().describe('Event type'), subtype: zod_1.z.string().describe('Event subtype') }))
                .describe('event list to unsubscribe'),
        }),
    },
};
exports.helpdeskV1FaqCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.faq.create',
    sdkName: 'helpdesk.v1.faq.create',
    path: '/open-apis/helpdesk/v1/faqs',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-FAQ-F\bAQ management-Create FAQs-This API is used to create FAQs',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            faq: zod_1.z
                .object({
                category_id: zod_1.z.string().describe('FAQs category ID').optional(),
                question: zod_1.z.string().describe('Question'),
                answer: zod_1.z.string().describe('Answer').optional(),
                answer_richtext: zod_1.z
                    .string()
                    .describe('Either the rich text answer or the answer is required, in the Json array format. For the rich text structure, see ')
                    .optional(),
                tags: zod_1.z.array(zod_1.z.string()).describe('Similar question').optional(),
            })
                .describe('FAQs details')
                .optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1FaqDelete = {
    project: 'helpdesk',
    name: 'helpdesk.v1.faq.delete',
    sdkName: 'helpdesk.v1.faq.delete',
    path: '/open-apis/helpdesk/v1/faqs/:id',
    httpMethod: 'DELETE',
    description: '[Feishu/Lark]-Help Desk-FAQ-F\bAQ management-Delete FAQs-This API is used to delete FAQs',
    accessTokens: ['user'],
    schema: {
        path: zod_1.z.object({ id: zod_1.z.string().describe('id').optional() }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1FaqGet = {
    project: 'helpdesk',
    name: 'helpdesk.v1.faq.get',
    sdkName: 'helpdesk.v1.faq.get',
    path: '/open-apis/helpdesk/v1/faqs/:id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-FAQ-F\bAQ management-Obtain FAQs details-This API is used to obtain FAQs details of Help Desk',
    accessTokens: ['tenant'],
    schema: {
        path: zod_1.z.object({ id: zod_1.z.string().describe('FAQs ID').optional() }),
    },
};
exports.helpdeskV1FaqList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.faq.list',
    sdkName: 'helpdesk.v1.faq.list',
    path: '/open-apis/helpdesk/v1/faqs',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-FAQ-F\bAQ management-Obtain all FAQs details-This API is used to obtain FAQs details of Help Desk',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            category_id: zod_1.z.string().describe('Knowledge Base Classification ID').optional(),
            status: zod_1.z
                .string()
                .describe('Search criteria: Knowledge Base Status 1: Online 0: Deleted, Recoverable 2: Deleted, Unrecoverable')
                .optional(),
            search: zod_1.z
                .string()
                .describe('Search criteria: keywords, matching question title, question keywords, user name')
                .optional(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
            page_size: zod_1.z.number().optional(),
        }),
    },
};
exports.helpdeskV1FaqPatch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.faq.patch',
    sdkName: 'helpdesk.v1.faq.patch',
    path: '/open-apis/helpdesk/v1/faqs/:id',
    httpMethod: 'PATCH',
    description: '[Feishu/Lark]-Help Desk-FAQ-F\bAQ management-Modify FAQs-This API is used to modify FAQs',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            faq: zod_1.z
                .object({
                category_id: zod_1.z.string().describe('FAQs category ID').optional(),
                question: zod_1.z.string().describe('Question'),
                answer: zod_1.z.string().describe('Answer').optional(),
                answer_richtext: zod_1.z
                    .array(zod_1.z.object({
                    content: zod_1.z.string().describe('Content').optional(),
                    type: zod_1.z.string().describe('Type. Optional values: text, hyperlink, img, line break').optional(),
                }))
                    .describe('Either the rich text answer or the answer is required, in the Json array format. For the rich text structure, see ')
                    .optional(),
                tags: zod_1.z.array(zod_1.z.string()).describe('Similar question').optional(),
            })
                .describe('Modified FAQs content')
                .optional(),
        }),
        path: zod_1.z.object({ id: zod_1.z.string().describe('FAQs ID').optional() }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1FaqSearch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.faq.search',
    sdkName: 'helpdesk.v1.faq.search',
    path: '/open-apis/helpdesk/v1/faqs/search',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-FAQ-F\bAQ management-Search FAQs-This API is used to search Help Desk FAQs',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            query: zod_1.z
                .string()
                .describe('Search query.If the query content is not in English, there are two encoding strategies: 1. URL encoding, 2. base64 encoding with base64=true parameters'),
            base64: zod_1.z
                .string()
                .describe('Whether to convert it to base64. Enter true for Yes. Leaving it blank indicates No. Chinese needs to be converted to base64')
                .optional(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
            page_size: zod_1.z.number().optional(),
        }),
    },
};
exports.helpdeskV1NotificationCancelApprove = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.cancelApprove',
    sdkName: 'helpdesk.v1.notification.cancelApprove',
    path: '/open-apis/helpdesk/v1/notifications/:notification_id/cancel_approve',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Notification-Cancel approval-Call this API to cancel the review after submission',
    accessTokens: ['user'],
    schema: {
        path: zod_1.z.object({ notification_id: zod_1.z.string().describe('Unique ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1NotificationCancelSend = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.cancelSend',
    sdkName: 'helpdesk.v1.notification.cancelSend',
    path: '/open-apis/helpdesk/v1/notifications/:notification_id/cancel_send',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Notification-Cancel notification-Cancel push API. This API can be called when waiting for the scheduled sending after approval, during message sending (the message sent will be recalled), and after sending (all the messages sent will be recalled)',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            is_recall: zod_1.z
                .boolean()
                .describe('Whether to recall the sent message, also applicable to the message for new staff'),
        }),
        path: zod_1.z.object({ notification_id: zod_1.z.string().describe('Unique ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1NotificationCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.create',
    sdkName: 'helpdesk.v1.notification.create',
    path: '/open-apis/helpdesk/v1/notifications',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Notification-Create notification-The API is called to create a push, which is in draft status after being created',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            id: zod_1.z.string().describe('Optional, returned upon successful creation').optional(),
            job_name: zod_1.z.string().describe('Required, task name').optional(),
            status: zod_1.z.number().describe('Optional, returned upon successful creation').optional(),
            create_user: zod_1.z
                .object({
                user_id: zod_1.z.string().describe('Optional, user ID').optional(),
                avatar_url: zod_1.z.string().describe('Optional, profile photo address').optional(),
                name: zod_1.z.string().describe('Optional, user name').optional(),
            })
                .describe('Optional, creator')
                .optional(),
            created_at: zod_1.z.string().describe('Optional, creation time (timestamp in ms)').optional(),
            update_user: zod_1.z
                .object({
                user_id: zod_1.z.string().describe('Optional, user ID').optional(),
                avatar_url: zod_1.z.string().describe('Optional, profile photo address').optional(),
                name: zod_1.z.string().describe('Optional, user name').optional(),
            })
                .describe('Optional, updated by')
                .optional(),
            updated_at: zod_1.z.string().describe('Optional, last update (timestamp in ms)').optional(),
            target_user_count: zod_1.z.number().describe('Optional, total number of target users pushed').optional(),
            sent_user_count: zod_1.z.number().describe('Optional, total number of users pushed').optional(),
            read_user_count: zod_1.z.number().describe('Optional, total number of users who have read').optional(),
            send_at: zod_1.z.string().describe('Optional, push task trigger time (timestamp in ms)').optional(),
            push_content: zod_1.z
                .string()
                .describe('Required, push content. For details, visit https://open.feishu.cn/tool/cardbuilder?fromhelpdesk.v1.type.notification.prop.read_user_count.desc=$$$Optional, total number of users who have read')
                .optional(),
            push_type: zod_1.z
                .number()
                .describe('Required,0 (Timed push: push_scope cannot be equal to 3), 1 (New staff onboarding push: push_scope must be equal to 1 or 3; new_staff_scope_type cannot be empty)')
                .optional(),
            push_scope_type: zod_1.z
                .number()
                .describe('Required,push scope (Help Desk private message) 0: All members in the organization (user_list and department_list must be empty), 1: None of the members (user_list and department_list must be empty, and chat_list cannot be empty), 2: Specified members (user_list or department_list cannot be empty), 3: New staff. chat_list for these four scopes are relatively independent, and is only required when the push scope is 1.')
                .optional(),
            new_staff_scope_type: zod_1.z
                .number()
                .describe('Optional,new staff enrollment scope type (effective when push_type is 1) 0: All new staff in the organization, 1: Specific department in the organization (new_staff_scope_department_list field cannot be empty)')
                .optional(),
            new_staff_scope_department_list: zod_1.z
                .array(zod_1.z.object({
                department_id: zod_1.z.string().describe('Department ID').optional(),
                name: zod_1.z.string().describe('Optional, department name').optional(),
            }))
                .describe('Optional, list of effective departments with onboarded employees')
                .optional(),
            user_list: zod_1.z
                .array(zod_1.z.object({
                user_id: zod_1.z.string().describe('Optional, user ID').optional(),
                avatar_url: zod_1.z.string().describe('Optional, profile photo address').optional(),
                name: zod_1.z.string().describe('Optional, user name').optional(),
            }))
                .describe('Optional, list of members to whom the message is pushed')
                .optional(),
            department_list: zod_1.z
                .array(zod_1.z.object({
                department_id: zod_1.z.string().describe('Department ID').optional(),
                name: zod_1.z.string().describe('Optional, department name').optional(),
            }))
                .describe('Optional, list of departments to which the message is pushed')
                .optional(),
            chat_list: zod_1.z
                .array(zod_1.z.object({
                chat_id: zod_1.z.string().describe('Optional, chat ID').optional(),
                name: zod_1.z.string().describe('Optional, chat name').optional(),
            }))
                .describe('Optional, list of group chats to which the message is pushed')
                .optional(),
            ext: zod_1.z.string().describe('Optional, extended field reserved').optional(),
        }),
        params: zod_1.z.object({ user_id_type: zod_1.z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1NotificationExecuteSend = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.executeSend',
    sdkName: 'helpdesk.v1.notification.executeSend',
    path: '/open-apis/helpdesk/v1/notifications/:notification_id/execute_send',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Notification-Push message-After approval, call this API to set the push time, and wait for the scheduling system to send the message',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({ send_at: zod_1.z.string().describe('Send the timestamp (in ms)') }),
        path: zod_1.z.object({ notification_id: zod_1.z.string().describe('The unique ID returned by the "Create push" API') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1NotificationGet = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.get',
    sdkName: 'helpdesk.v1.notification.get',
    path: '/open-apis/helpdesk/v1/notifications/:notification_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Notification-Query notification-Query push details',
    accessTokens: ['user'],
    schema: {
        params: zod_1.z.object({ user_id_type: zod_1.z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() }),
        path: zod_1.z.object({ notification_id: zod_1.z.string().describe('Unique ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1NotificationPatch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.patch',
    sdkName: 'helpdesk.v1.notification.patch',
    path: '/open-apis/helpdesk/v1/notifications/:notification_id',
    httpMethod: 'PATCH',
    description: '[Feishu/Lark]-Help Desk-Notification-Update notification-Update push message. This API can only be called when the message is in draft status',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            id: zod_1.z.string().describe('Optional, returned upon successful creation').optional(),
            job_name: zod_1.z.string().describe('Required, task name').optional(),
            status: zod_1.z.number().describe('Optional, returned upon successful creation').optional(),
            create_user: zod_1.z
                .object({
                user_id: zod_1.z.string().describe('Optional, user ID').optional(),
                avatar_url: zod_1.z.string().describe('Optional, profile photo address').optional(),
                name: zod_1.z.string().describe('Optional, user name').optional(),
            })
                .describe('Optional, creator')
                .optional(),
            created_at: zod_1.z.string().describe('Optional, creation time (timestamp in ms)').optional(),
            update_user: zod_1.z
                .object({
                user_id: zod_1.z.string().describe('Optional, user ID').optional(),
                avatar_url: zod_1.z.string().describe('Optional, profile photo address').optional(),
                name: zod_1.z.string().describe('Optional, user name').optional(),
            })
                .describe('Optional, updated by')
                .optional(),
            updated_at: zod_1.z.string().describe('Optional, last update (timestamp in ms)').optional(),
            target_user_count: zod_1.z.number().describe('Optional, total number of target users pushed').optional(),
            sent_user_count: zod_1.z.number().describe('Optional, total number of users pushed').optional(),
            read_user_count: zod_1.z.number().describe('Optional, total number of users who have read').optional(),
            send_at: zod_1.z.string().describe('Optional, push task trigger time (timestamp in ms)').optional(),
            push_content: zod_1.z
                .string()
                .describe('Required, push content. For details, visit https://open.feishu.cn/tool/cardbuilder?fromhelpdesk.v1.type.notification.prop.read_user_count.desc=$$$Optional, total number of users who have read')
                .optional(),
            push_type: zod_1.z
                .number()
                .describe('Required,0 (Timed push: push_scope cannot be equal to 3), 1 (New staff onboarding push: push_scope must be equal to 1 or 3; new_staff_scope_type cannot be empty)')
                .optional(),
            push_scope_type: zod_1.z
                .number()
                .describe('Required,push scope (Help Desk private message) 0: All members in the organization (user_list and department_list must be empty), 1: None of the members (user_list and department_list must be empty, and chat_list cannot be empty), 2: Specified members (user_list or department_list cannot be empty), 3: New staff. chat_list for these four scopes are relatively independent, and is only required when the push scope is 1.')
                .optional(),
            new_staff_scope_type: zod_1.z
                .number()
                .describe('Optional,new staff enrollment scope type (effective when push_type is 1) 0: All new staff in the organization, 1: Specific department in the organization (new_staff_scope_department_list field cannot be empty)')
                .optional(),
            new_staff_scope_department_list: zod_1.z
                .array(zod_1.z.object({
                department_id: zod_1.z.string().describe('Department ID').optional(),
                name: zod_1.z.string().describe('Optional, department name').optional(),
            }))
                .describe('Optional, list of effective departments with onboarded employees')
                .optional(),
            user_list: zod_1.z
                .array(zod_1.z.object({
                user_id: zod_1.z.string().describe('Optional, user ID').optional(),
                avatar_url: zod_1.z.string().describe('Optional, profile photo address').optional(),
                name: zod_1.z.string().describe('Optional, user name').optional(),
            }))
                .describe('Optional, list of members to whom the message is pushed')
                .optional(),
            department_list: zod_1.z
                .array(zod_1.z.object({
                department_id: zod_1.z.string().describe('Department ID').optional(),
                name: zod_1.z.string().describe('Optional, department name').optional(),
            }))
                .describe('Optional, list of departments to which the message is pushed')
                .optional(),
            chat_list: zod_1.z
                .array(zod_1.z.object({
                chat_id: zod_1.z.string().describe('Optional, chat ID').optional(),
                name: zod_1.z.string().describe('Optional, chat name').optional(),
            }))
                .describe('Optional, list of group chats to which the message is pushed')
                .optional(),
            ext: zod_1.z.string().describe('Optional, extended field reserved').optional(),
        }),
        params: zod_1.z.object({ user_id_type: zod_1.z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() }),
        path: zod_1.z.object({ notification_id: zod_1.z.string().describe('Push task unique ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1NotificationPreview = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.preview',
    sdkName: 'helpdesk.v1.notification.preview',
    path: '/open-apis/helpdesk/v1/notifications/:notification_id/preview',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Notification-Preview notification-This API can be called to preview the set push content before the push',
    accessTokens: ['user'],
    schema: {
        path: zod_1.z.object({
            notification_id: zod_1.z.string().describe('Unique ID returned after successful creation of the push API'),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1NotificationSubmitApprove = {
    project: 'helpdesk',
    name: 'helpdesk.v1.notification.submitApprove',
    sdkName: 'helpdesk.v1.notification.submitApprove',
    path: '/open-apis/helpdesk/v1/notifications/:notification_id/submit_approve',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Notification-Submit approval-Normally, the "Submit for review" API can be called after the "Create push" API is called. If the creator is the Help Desk owner, the push message will be automatically approved; otherwise, the Help Desk owner will be notified to review the push message',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({ reason: zod_1.z.string().describe('Submit reasons for approval') }),
        path: zod_1.z.object({ notification_id: zod_1.z.string().describe('The unique ID returned by the "Create push" API') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1TicketCustomizedFieldCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticketCustomizedField.create',
    sdkName: 'helpdesk.v1.ticketCustomizedField.create',
    path: '/open-apis/helpdesk/v1/ticket_customized_fields',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket customized field-Create custom ticket fields-create ticket customized field',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            helpdesk_id: zod_1.z.string().optional(),
            key_name: zod_1.z.string(),
            display_name: zod_1.z.string(),
            position: zod_1.z.string(),
            field_type: zod_1.z.string(),
            description: zod_1.z.string(),
            visible: zod_1.z.boolean(),
            editable: zod_1.z.boolean().optional(),
            required: zod_1.z.boolean(),
            dropdown_allow_multiple: zod_1.z.boolean().optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1TicketCustomizedFieldDelete = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticketCustomizedField.delete',
    sdkName: 'helpdesk.v1.ticketCustomizedField.delete',
    path: '/open-apis/helpdesk/v1/ticket_customized_fields/:ticket_customized_field_id',
    httpMethod: 'DELETE',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket customized field-Delete custom ticket fields-This API is used to delete custom ticket fields',
    accessTokens: ['user'],
    schema: {
        path: zod_1.z.object({ ticket_customized_field_id: zod_1.z.string().describe('Custom ticket field ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1TicketCustomizedFieldGet = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticketCustomizedField.get',
    sdkName: 'helpdesk.v1.ticketCustomizedField.get',
    path: '/open-apis/helpdesk/v1/ticket_customized_fields/:ticket_customized_field_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket customized field-Obtain custom ticket fields-get ticket customized field',
    accessTokens: ['tenant'],
    schema: {
        path: zod_1.z.object({ ticket_customized_field_id: zod_1.z.string().describe('Work order custom field ID') }),
    },
};
exports.helpdeskV1TicketCustomizedFieldList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticketCustomizedField.list',
    sdkName: 'helpdesk.v1.ticketCustomizedField.list',
    path: '/open-apis/helpdesk/v1/ticket_customized_fields',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket customized field-Obtain all custom fields of ticket-list the ticket customized fields',
    accessTokens: ['tenant'],
    schema: {
        data: zod_1.z.object({ visible: zod_1.z.boolean().describe('Is it visible').optional() }),
        params: zod_1.z.object({ page_token: zod_1.z.string().optional(), page_size: zod_1.z.number().optional() }),
    },
};
exports.helpdeskV1TicketCustomizedFieldPatch = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticketCustomizedField.patch',
    sdkName: 'helpdesk.v1.ticketCustomizedField.patch',
    path: '/open-apis/helpdesk/v1/ticket_customized_fields/:ticket_customized_field_id',
    httpMethod: 'PATCH',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket customized field-Update custom fields of ticket-update the ticket customized field',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            display_name: zod_1.z.string().optional(),
            position: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            visible: zod_1.z.boolean().optional(),
            required: zod_1.z.boolean().optional(),
        }),
        path: zod_1.z.object({ ticket_customized_field_id: zod_1.z.string().describe('Work order custom field ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1TicketAnswerUserQuery = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticket.answerUserQuery',
    sdkName: 'helpdesk.v1.ticket.answerUserQuery',
    path: '/open-apis/helpdesk/v1/tickets/:ticket_id/answer_user_query',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket management-Reply user query results to tickets-This API is used to reply user query results to tickets that are in progress and not handed off to any human agent. Only custom apps are supported',
    accessTokens: ['tenant'],
    schema: {
        data: zod_1.z.object({
            event_id: zod_1.z.string().describe('Event ID, which can be extracted from subscription events'),
            faqs: zod_1.z
                .array(zod_1.z.object({
                id: zod_1.z.string().describe('FAQ ID').optional(),
                score: zod_1.z.number().describe('FAQ score').optional(),
            }))
                .describe('List of FAQs')
                .optional(),
        }),
        path: zod_1.z.object({ ticket_id: zod_1.z.string().describe('Ticket ID') }),
    },
};
exports.helpdeskV1TicketCustomizedFields = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticket.customizedFields',
    sdkName: 'helpdesk.v1.ticket.customizedFields',
    path: '/open-apis/helpdesk/v1/customized_fields',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket management-List customized fields-This API is used to obtain Help Desk custom field details',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({ visible_only: zod_1.z.boolean().describe('visible only').optional() }),
    },
};
exports.helpdeskV1TicketGet = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticket.get',
    sdkName: 'helpdesk.v1.ticket.get',
    path: '/open-apis/helpdesk/v1/tickets/:ticket_id',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket management-Obtain ticket details-This API is used to obtain details of a Help Desk ticket. Only custom apps are supported',
    accessTokens: ['tenant'],
    schema: {
        path: zod_1.z.object({ ticket_id: zod_1.z.string().describe('ticket id') }),
    },
};
exports.helpdeskV1TicketList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticket.list',
    sdkName: 'helpdesk.v1.ticket.list',
    path: '/open-apis/helpdesk/v1/tickets',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket management-Obtain all ticket details-This API is used to obtain details of all tickets. Only custom apps are supported',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            ticket_id: zod_1.z.string().describe('Search criterion: ticket ID').optional(),
            agent_id: zod_1.z.string().describe('Search criterion: agent ID').optional(),
            closed_by_id: zod_1.z.string().describe('Search criterion: ID of the agent closing the ticket').optional(),
            type: zod_1.z.number().describe('Search criterion: ticket type. 1: bot; 2: agent').optional(),
            channel: zod_1.z.number().describe('Search criterion: ticket channel').optional(),
            solved: zod_1.z.number().describe('Search criterion: Ticket resolved. 1: not resolved, 2: resolved').optional(),
            score: zod_1.z.number().describe('Search criterion: ticket score').optional(),
            status_list: zod_1.z.array(zod_1.z.number()).describe('Search criterion: ticket status list').optional(),
            guest_name: zod_1.z.string().describe('Search criterion: user name').optional(),
            guest_id: zod_1.z.string().describe('Search criterion: user ID').optional(),
            tags: zod_1.z.array(zod_1.z.string()).describe('Search criterion: user label list').optional(),
            page: zod_1.z.number().describe('Number of pages, starting from 1, default is 1').optional(),
            page_size: zod_1.z
                .number()
                .describe('The current page size. The maximum value is 200. The default value is 20. A maximum of 10,000 data entries can be returned for paging query. If you want to query more than 10,000 entries, change the query criteria. It is recommended to query by time')
                .optional(),
            create_time_start: zod_1.z
                .number()
                .describe('Search criterion: ticket creation start time, in ms (used with create_time_end), equivalent to >helpdesk.v1.type.ticket.prop.collaborators.desc=$$$Ticket collaborator')
                .optional(),
            create_time_end: zod_1.z
                .number()
                .describe('Search criterion: ticket creation end time, in ms, (used with create_time_start), equivalent to <helpdesk.v1.type.ticket.prop.created_at.int.example=$$$1616920429000')
                .optional(),
            update_time_start: zod_1.z
                .number()
                .describe('Search criterion: ticket modification start time, in ms (used with update_time_end)')
                .optional(),
            update_time_end: zod_1.z
                .number()
                .describe('Search criterion: ticket modification end time, in ms (used with update_time_start)')
                .optional(),
        }),
    },
};
exports.helpdeskV1TicketMessageCreate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticketMessage.create',
    sdkName: 'helpdesk.v1.ticketMessage.create',
    path: '/open-apis/helpdesk/v1/tickets/:ticket_id/messages',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket message-Send ticket messages-This API is used to send ticket messages',
    accessTokens: ['tenant'],
    schema: {
        data: zod_1.z.object({
            msg_type: zod_1.z.string().describe('Message type. text: plain text; post: rich text'),
            content: zod_1.z.string().describe('- Plain text, (see content in )- Rich text (see content in )'),
        }),
        path: zod_1.z.object({ ticket_id: zod_1.z.string().describe('Ticket ID').optional() }),
    },
};
exports.helpdeskV1TicketMessageList = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticketMessage.list',
    sdkName: 'helpdesk.v1.ticketMessage.list',
    path: '/open-apis/helpdesk/v1/tickets/:ticket_id/messages',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket message-Get ticket message details-This API is used to obtain details of Help Desk ticket messages',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            time_start: zod_1.z.number().describe('Start time').optional(),
            time_end: zod_1.z.number().describe('End time').optional(),
            page: zod_1.z.number().describe('Page ID').optional(),
            page_size: zod_1.z.number().describe('Number of messages. Max. value: 200. Default value: 20').optional(),
        }),
        path: zod_1.z.object({ ticket_id: zod_1.z.string().describe('Ticket ID').optional() }),
    },
};
exports.helpdeskV1TicketStartService = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticket.startService',
    sdkName: 'helpdesk.v1.ticket.startService',
    path: '/open-apis/helpdesk/v1/start_service',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket management-Create a Help Desk chat-This API is used to create a Help Desk chat',
    accessTokens: ['tenant'],
    schema: {
        data: zod_1.z.object({
            human_service: zod_1.z
                .boolean()
                .describe('Specifies whether to enter human agent service directly (required if appointed_agents is entered)')
                .optional(),
            appointed_agents: zod_1.z
                .array(zod_1.z.string())
                .describe('Agent Open IDs (for how to obtain them, see ). human_service should be true')
                .optional(),
            open_id: zod_1.z.string().describe('User Open ID, (for how to obtain them, see .)'),
            customized_info: zod_1.z
                .string()
                .describe('Custom information of the ticket source (at most 1,024 characters). If this field is set, the information will be returned when  is called')
                .optional(),
        }),
    },
};
exports.helpdeskV1TicketUpdate = {
    project: 'helpdesk',
    name: 'helpdesk.v1.ticket.update',
    sdkName: 'helpdesk.v1.ticket.update',
    path: '/open-apis/helpdesk/v1/tickets/:ticket_id',
    httpMethod: 'PUT',
    description: '[Feishu/Lark]-Help Desk-Ticket-Ticket management-Update ticket details-This API is used to update Help Desk ticket details. This API only updates data and do not trigger actions. For example, changing the ticket status to "closed" by calling this API will not close the chat page. Only custom apps are supported. Ticket fields to be updated cannot be left empty',
    accessTokens: ['user'],
    schema: {
        data: zod_1.z.object({
            status: zod_1.z
                .number()
                .describe('New status. 1: Created, 2: Processing, 3: In queue, 5: Pending, 50: Ticket closed by bot, 51: Ticket closed by agent or user')
                .optional(),
            tag_names: zod_1.z.array(zod_1.z.string()).describe('New tag name').optional(),
            comment: zod_1.z.string().describe('New comment').optional(),
            customized_fields: zod_1.z
                .array(zod_1.z.object({
                id: zod_1.z.string().describe('Custom field ID').optional(),
                value: zod_1.z.string().describe('Custom field value').optional(),
                key_name: zod_1.z.string().describe('Key name').optional(),
            }))
                .describe('Custom field')
                .optional(),
            ticket_type: zod_1.z.number().describe('ticket stage').optional(),
            solved: zod_1.z.number().describe('Specifies whether the ticket is resolved, 1: not resolved, 2: resolved').optional(),
            channel: zod_1.z.number().describe('ID of the ticket source channel').optional(),
        }),
        path: zod_1.z.object({ ticket_id: zod_1.z.string().describe('Ticket ID') }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.helpdeskV1Tools = [
    exports.helpdeskV1AgentScheduleCreate,
    exports.helpdeskV1AgentScheduleList,
    exports.helpdeskV1AgentSkillRuleList,
    exports.helpdeskV1AgentSkillCreate,
    exports.helpdeskV1AgentSkillDelete,
    exports.helpdeskV1AgentSkillGet,
    exports.helpdeskV1AgentSkillList,
    exports.helpdeskV1AgentSkillPatch,
    exports.helpdeskV1AgentAgentEmail,
    exports.helpdeskV1AgentPatch,
    exports.helpdeskV1AgentSchedulesDelete,
    exports.helpdeskV1AgentSchedulesGet,
    exports.helpdeskV1AgentSchedulesPatch,
    exports.helpdeskV1BotMessageCreate,
    exports.helpdeskV1CategoryCreate,
    exports.helpdeskV1CategoryDelete,
    exports.helpdeskV1CategoryGet,
    exports.helpdeskV1CategoryList,
    exports.helpdeskV1CategoryPatch,
    exports.helpdeskV1EventSubscribe,
    exports.helpdeskV1EventUnsubscribe,
    exports.helpdeskV1FaqCreate,
    exports.helpdeskV1FaqDelete,
    exports.helpdeskV1FaqGet,
    exports.helpdeskV1FaqList,
    exports.helpdeskV1FaqPatch,
    exports.helpdeskV1FaqSearch,
    exports.helpdeskV1NotificationCancelApprove,
    exports.helpdeskV1NotificationCancelSend,
    exports.helpdeskV1NotificationCreate,
    exports.helpdeskV1NotificationExecuteSend,
    exports.helpdeskV1NotificationGet,
    exports.helpdeskV1NotificationPatch,
    exports.helpdeskV1NotificationPreview,
    exports.helpdeskV1NotificationSubmitApprove,
    exports.helpdeskV1TicketCustomizedFieldCreate,
    exports.helpdeskV1TicketCustomizedFieldDelete,
    exports.helpdeskV1TicketCustomizedFieldGet,
    exports.helpdeskV1TicketCustomizedFieldList,
    exports.helpdeskV1TicketCustomizedFieldPatch,
    exports.helpdeskV1TicketAnswerUserQuery,
    exports.helpdeskV1TicketCustomizedFields,
    exports.helpdeskV1TicketGet,
    exports.helpdeskV1TicketList,
    exports.helpdeskV1TicketMessageCreate,
    exports.helpdeskV1TicketMessageList,
    exports.helpdeskV1TicketStartService,
    exports.helpdeskV1TicketUpdate,
];
