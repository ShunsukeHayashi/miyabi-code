import { z } from 'zod';
export type helpdeskV1ToolName = 'helpdesk.v1.agentSchedule.create' | 'helpdesk.v1.agentSchedule.list' | 'helpdesk.v1.agentSkillRule.list' | 'helpdesk.v1.agentSkill.create' | 'helpdesk.v1.agentSkill.delete' | 'helpdesk.v1.agentSkill.get' | 'helpdesk.v1.agentSkill.list' | 'helpdesk.v1.agentSkill.patch' | 'helpdesk.v1.agent.agentEmail' | 'helpdesk.v1.agent.patch' | 'helpdesk.v1.agentSchedules.delete' | 'helpdesk.v1.agentSchedules.get' | 'helpdesk.v1.agentSchedules.patch' | 'helpdesk.v1.botMessage.create' | 'helpdesk.v1.category.create' | 'helpdesk.v1.category.delete' | 'helpdesk.v1.category.get' | 'helpdesk.v1.category.list' | 'helpdesk.v1.category.patch' | 'helpdesk.v1.event.subscribe' | 'helpdesk.v1.event.unsubscribe' | 'helpdesk.v1.faq.create' | 'helpdesk.v1.faq.delete' | 'helpdesk.v1.faq.get' | 'helpdesk.v1.faq.list' | 'helpdesk.v1.faq.patch' | 'helpdesk.v1.faq.search' | 'helpdesk.v1.notification.cancelApprove' | 'helpdesk.v1.notification.cancelSend' | 'helpdesk.v1.notification.create' | 'helpdesk.v1.notification.executeSend' | 'helpdesk.v1.notification.get' | 'helpdesk.v1.notification.patch' | 'helpdesk.v1.notification.preview' | 'helpdesk.v1.notification.submitApprove' | 'helpdesk.v1.ticketCustomizedField.create' | 'helpdesk.v1.ticketCustomizedField.delete' | 'helpdesk.v1.ticketCustomizedField.get' | 'helpdesk.v1.ticketCustomizedField.list' | 'helpdesk.v1.ticketCustomizedField.patch' | 'helpdesk.v1.ticket.answerUserQuery' | 'helpdesk.v1.ticket.customizedFields' | 'helpdesk.v1.ticket.get' | 'helpdesk.v1.ticket.list' | 'helpdesk.v1.ticketMessage.create' | 'helpdesk.v1.ticketMessage.list' | 'helpdesk.v1.ticket.startService' | 'helpdesk.v1.ticket.update';
export declare const helpdeskV1AgentScheduleCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            agent_schedules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                agent_id: z.ZodOptional<z.ZodString>;
                schedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    start_time: z.ZodOptional<z.ZodString>;
                    end_time: z.ZodOptional<z.ZodString>;
                    weekday: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }, {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }>, "many">>;
                agent_skill_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_id?: string | undefined;
                agent_skill_ids?: string[] | undefined;
            }, {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_id?: string | undefined;
                agent_skill_ids?: string[] | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            agent_schedules?: {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_id?: string | undefined;
                agent_skill_ids?: string[] | undefined;
            }[] | undefined;
        }, {
            agent_schedules?: {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_id?: string | undefined;
                agent_skill_ids?: string[] | undefined;
            }[] | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1AgentScheduleList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            status: z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            status: number[];
        }, {
            status: number[];
        }>;
    };
};
export declare const helpdeskV1AgentSkillRuleList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {};
};
export declare const helpdeskV1AgentSkillCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                selected_operator: z.ZodOptional<z.ZodNumber>;
                operand: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                category?: number | undefined;
                id?: string | undefined;
                selected_operator?: number | undefined;
                operand?: string | undefined;
            }, {
                category?: number | undefined;
                id?: string | undefined;
                selected_operator?: number | undefined;
                operand?: string | undefined;
            }>, "many">>;
            agent_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            rules?: {
                category?: number | undefined;
                id?: string | undefined;
                selected_operator?: number | undefined;
                operand?: string | undefined;
            }[] | undefined;
            agent_ids?: string[] | undefined;
        }, {
            name?: string | undefined;
            rules?: {
                category?: number | undefined;
                id?: string | undefined;
                selected_operator?: number | undefined;
                operand?: string | undefined;
            }[] | undefined;
            agent_ids?: string[] | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1AgentSkillDelete: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            agent_skill_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            agent_skill_id?: string | undefined;
        }, {
            agent_skill_id?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1AgentSkillGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            agent_skill_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            agent_skill_id?: string | undefined;
        }, {
            agent_skill_id?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1AgentSkillList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {};
};
export declare const helpdeskV1AgentSkillPatch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            agent_skill: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
                rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodOptional<z.ZodString>;
                    selected_operator: z.ZodOptional<z.ZodNumber>;
                    operator_options: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
                    operand: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    id?: string | undefined;
                    selected_operator?: number | undefined;
                    operand?: string | undefined;
                    operator_options?: number[] | undefined;
                }, {
                    id?: string | undefined;
                    selected_operator?: number | undefined;
                    operand?: string | undefined;
                    operator_options?: number[] | undefined;
                }>, "many">>;
                agent_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                name?: string | undefined;
                rules?: {
                    id?: string | undefined;
                    selected_operator?: number | undefined;
                    operand?: string | undefined;
                    operator_options?: number[] | undefined;
                }[] | undefined;
                agent_ids?: string[] | undefined;
            }, {
                name?: string | undefined;
                rules?: {
                    id?: string | undefined;
                    selected_operator?: number | undefined;
                    operand?: string | undefined;
                    operator_options?: number[] | undefined;
                }[] | undefined;
                agent_ids?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            agent_skill?: {
                name?: string | undefined;
                rules?: {
                    id?: string | undefined;
                    selected_operator?: number | undefined;
                    operand?: string | undefined;
                    operator_options?: number[] | undefined;
                }[] | undefined;
                agent_ids?: string[] | undefined;
            } | undefined;
        }, {
            agent_skill?: {
                name?: string | undefined;
                rules?: {
                    id?: string | undefined;
                    selected_operator?: number | undefined;
                    operand?: string | undefined;
                    operator_options?: number[] | undefined;
                }[] | undefined;
                agent_ids?: string[] | undefined;
            } | undefined;
        }>;
        path: z.ZodObject<{
            agent_skill_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            agent_skill_id: string;
        }, {
            agent_skill_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1AgentAgentEmail: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {};
};
export declare const helpdeskV1AgentPatch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            status: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            status?: number | undefined;
        }, {
            status?: number | undefined;
        }>;
        path: z.ZodObject<{
            agent_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            agent_id: string;
        }, {
            agent_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1AgentSchedulesDelete: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            agent_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            agent_id?: string | undefined;
        }, {
            agent_id?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1AgentSchedulesGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            agent_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            agent_id: string;
        }, {
            agent_id: string;
        }>;
    };
};
export declare const helpdeskV1AgentSchedulesPatch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            agent_schedule: z.ZodOptional<z.ZodObject<{
                schedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    start_time: z.ZodOptional<z.ZodString>;
                    end_time: z.ZodOptional<z.ZodString>;
                    weekday: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }, {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }>, "many">>;
                agent_skill_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_skill_ids?: string[] | undefined;
            }, {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_skill_ids?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            agent_schedule?: {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_skill_ids?: string[] | undefined;
            } | undefined;
        }, {
            agent_schedule?: {
                schedule?: {
                    start_time?: string | undefined;
                    end_time?: string | undefined;
                    weekday?: number | undefined;
                }[] | undefined;
                agent_skill_ids?: string[] | undefined;
            } | undefined;
        }>;
        path: z.ZodObject<{
            agent_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            agent_id: string;
        }, {
            agent_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1BotMessageCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            msg_type: z.ZodEnum<["text", "post", "image", "interactive"]>;
            content: z.ZodString;
            receiver_id: z.ZodString;
            receive_type: z.ZodOptional<z.ZodEnum<["chat", "user"]>>;
        }, "strip", z.ZodTypeAny, {
            content: string;
            msg_type: "text" | "image" | "post" | "interactive";
            receiver_id: string;
            receive_type?: "user" | "chat" | undefined;
        }, {
            content: string;
            msg_type: "text" | "image" | "post" | "interactive";
            receiver_id: string;
            receive_type?: "user" | "chat" | undefined;
        }>;
        params: z.ZodObject<{
            user_id_type: z.ZodOptional<z.ZodEnum<["open_id", "union_id", "user_id"]>>;
        }, "strip", z.ZodTypeAny, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }>;
    };
};
export declare const helpdeskV1CategoryCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            name: z.ZodString;
            parent_id: z.ZodString;
            language: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            parent_id: string;
            language?: string | undefined;
        }, {
            name: string;
            parent_id: string;
            language?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1CategoryDelete: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1CategoryGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
    };
};
export declare const helpdeskV1CategoryList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            lang: z.ZodOptional<z.ZodString>;
            order_by: z.ZodOptional<z.ZodNumber>;
            asc: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            asc?: boolean | undefined;
            order_by?: number | undefined;
            lang?: string | undefined;
        }, {
            asc?: boolean | undefined;
            order_by?: number | undefined;
            lang?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1CategoryPatch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            parent_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            parent_id?: string | undefined;
        }, {
            name?: string | undefined;
            parent_id?: string | undefined;
        }>;
        path: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1EventSubscribe: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            events: z.ZodArray<z.ZodObject<{
                type: z.ZodString;
                subtype: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: string;
                subtype: string;
            }, {
                type: string;
                subtype: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            events: {
                type: string;
                subtype: string;
            }[];
        }, {
            events: {
                type: string;
                subtype: string;
            }[];
        }>;
    };
};
export declare const helpdeskV1EventUnsubscribe: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            events: z.ZodArray<z.ZodObject<{
                type: z.ZodString;
                subtype: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: string;
                subtype: string;
            }, {
                type: string;
                subtype: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            events: {
                type: string;
                subtype: string;
            }[];
        }, {
            events: {
                type: string;
                subtype: string;
            }[];
        }>;
    };
};
export declare const helpdeskV1FaqCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            faq: z.ZodOptional<z.ZodObject<{
                category_id: z.ZodOptional<z.ZodString>;
                question: z.ZodString;
                answer: z.ZodOptional<z.ZodString>;
                answer_richtext: z.ZodOptional<z.ZodString>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: string | undefined;
                tags?: string[] | undefined;
            }, {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: string | undefined;
                tags?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            faq?: {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: string | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }, {
            faq?: {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: string | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1FaqDelete: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string | undefined;
        }, {
            id?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1FaqGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string | undefined;
        }, {
            id?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1FaqList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            category_id: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodString>;
            search: z.ZodOptional<z.ZodString>;
            page_token: z.ZodOptional<z.ZodString>;
            page_size: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            search?: string | undefined;
            status?: string | undefined;
            page_size?: number | undefined;
            page_token?: string | undefined;
            category_id?: string | undefined;
        }, {
            search?: string | undefined;
            status?: string | undefined;
            page_size?: number | undefined;
            page_token?: string | undefined;
            category_id?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1FaqPatch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            faq: z.ZodOptional<z.ZodObject<{
                category_id: z.ZodOptional<z.ZodString>;
                question: z.ZodString;
                answer: z.ZodOptional<z.ZodString>;
                answer_richtext: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    content: z.ZodOptional<z.ZodString>;
                    type: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    type?: string | undefined;
                    content?: string | undefined;
                }, {
                    type?: string | undefined;
                    content?: string | undefined;
                }>, "many">>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: {
                    type?: string | undefined;
                    content?: string | undefined;
                }[] | undefined;
                tags?: string[] | undefined;
            }, {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: {
                    type?: string | undefined;
                    content?: string | undefined;
                }[] | undefined;
                tags?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            faq?: {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: {
                    type?: string | undefined;
                    content?: string | undefined;
                }[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }, {
            faq?: {
                question: string;
                category_id?: string | undefined;
                answer?: string | undefined;
                answer_richtext?: {
                    type?: string | undefined;
                    content?: string | undefined;
                }[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }>;
        path: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string | undefined;
        }, {
            id?: string | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1FaqSearch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            query: z.ZodString;
            base64: z.ZodOptional<z.ZodString>;
            page_token: z.ZodOptional<z.ZodString>;
            page_size: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            query: string;
            base64?: string | undefined;
            page_size?: number | undefined;
            page_token?: string | undefined;
        }, {
            query: string;
            base64?: string | undefined;
            page_size?: number | undefined;
            page_token?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1NotificationCancelApprove: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            notification_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notification_id: string;
        }, {
            notification_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1NotificationCancelSend: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            is_recall: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            is_recall: boolean;
        }, {
            is_recall: boolean;
        }>;
        path: z.ZodObject<{
            notification_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notification_id: string;
        }, {
            notification_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1NotificationCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            job_name: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodNumber>;
            create_user: z.ZodOptional<z.ZodObject<{
                user_id: z.ZodOptional<z.ZodString>;
                avatar_url: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }>>;
            created_at: z.ZodOptional<z.ZodString>;
            update_user: z.ZodOptional<z.ZodObject<{
                user_id: z.ZodOptional<z.ZodString>;
                avatar_url: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }>>;
            updated_at: z.ZodOptional<z.ZodString>;
            target_user_count: z.ZodOptional<z.ZodNumber>;
            sent_user_count: z.ZodOptional<z.ZodNumber>;
            read_user_count: z.ZodOptional<z.ZodNumber>;
            send_at: z.ZodOptional<z.ZodString>;
            push_content: z.ZodOptional<z.ZodString>;
            push_type: z.ZodOptional<z.ZodNumber>;
            push_scope_type: z.ZodOptional<z.ZodNumber>;
            new_staff_scope_type: z.ZodOptional<z.ZodNumber>;
            new_staff_scope_department_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                department_id: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name?: string | undefined;
                department_id?: string | undefined;
            }, {
                name?: string | undefined;
                department_id?: string | undefined;
            }>, "many">>;
            user_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                user_id: z.ZodOptional<z.ZodString>;
                avatar_url: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }>, "many">>;
            department_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                department_id: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name?: string | undefined;
                department_id?: string | undefined;
            }, {
                name?: string | undefined;
                department_id?: string | undefined;
            }>, "many">>;
            chat_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                chat_id: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                chat_id?: string | undefined;
                name?: string | undefined;
            }, {
                chat_id?: string | undefined;
                name?: string | undefined;
            }>, "many">>;
            ext: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status?: number | undefined;
            id?: string | undefined;
            job_name?: string | undefined;
            create_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            created_at?: string | undefined;
            update_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            updated_at?: string | undefined;
            target_user_count?: number | undefined;
            sent_user_count?: number | undefined;
            read_user_count?: number | undefined;
            send_at?: string | undefined;
            push_content?: string | undefined;
            push_type?: number | undefined;
            push_scope_type?: number | undefined;
            new_staff_scope_type?: number | undefined;
            new_staff_scope_department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            user_list?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }[] | undefined;
            department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            chat_list?: {
                chat_id?: string | undefined;
                name?: string | undefined;
            }[] | undefined;
            ext?: string | undefined;
        }, {
            status?: number | undefined;
            id?: string | undefined;
            job_name?: string | undefined;
            create_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            created_at?: string | undefined;
            update_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            updated_at?: string | undefined;
            target_user_count?: number | undefined;
            sent_user_count?: number | undefined;
            read_user_count?: number | undefined;
            send_at?: string | undefined;
            push_content?: string | undefined;
            push_type?: number | undefined;
            push_scope_type?: number | undefined;
            new_staff_scope_type?: number | undefined;
            new_staff_scope_department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            user_list?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }[] | undefined;
            department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            chat_list?: {
                chat_id?: string | undefined;
                name?: string | undefined;
            }[] | undefined;
            ext?: string | undefined;
        }>;
        params: z.ZodObject<{
            user_id_type: z.ZodOptional<z.ZodEnum<["open_id", "union_id", "user_id"]>>;
        }, "strip", z.ZodTypeAny, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1NotificationExecuteSend: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            send_at: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            send_at: string;
        }, {
            send_at: string;
        }>;
        path: z.ZodObject<{
            notification_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notification_id: string;
        }, {
            notification_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1NotificationGet: {
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
            notification_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notification_id: string;
        }, {
            notification_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1NotificationPatch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            job_name: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodNumber>;
            create_user: z.ZodOptional<z.ZodObject<{
                user_id: z.ZodOptional<z.ZodString>;
                avatar_url: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }>>;
            created_at: z.ZodOptional<z.ZodString>;
            update_user: z.ZodOptional<z.ZodObject<{
                user_id: z.ZodOptional<z.ZodString>;
                avatar_url: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }>>;
            updated_at: z.ZodOptional<z.ZodString>;
            target_user_count: z.ZodOptional<z.ZodNumber>;
            sent_user_count: z.ZodOptional<z.ZodNumber>;
            read_user_count: z.ZodOptional<z.ZodNumber>;
            send_at: z.ZodOptional<z.ZodString>;
            push_content: z.ZodOptional<z.ZodString>;
            push_type: z.ZodOptional<z.ZodNumber>;
            push_scope_type: z.ZodOptional<z.ZodNumber>;
            new_staff_scope_type: z.ZodOptional<z.ZodNumber>;
            new_staff_scope_department_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                department_id: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name?: string | undefined;
                department_id?: string | undefined;
            }, {
                name?: string | undefined;
                department_id?: string | undefined;
            }>, "many">>;
            user_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                user_id: z.ZodOptional<z.ZodString>;
                avatar_url: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }, {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }>, "many">>;
            department_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                department_id: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name?: string | undefined;
                department_id?: string | undefined;
            }, {
                name?: string | undefined;
                department_id?: string | undefined;
            }>, "many">>;
            chat_list: z.ZodOptional<z.ZodArray<z.ZodObject<{
                chat_id: z.ZodOptional<z.ZodString>;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                chat_id?: string | undefined;
                name?: string | undefined;
            }, {
                chat_id?: string | undefined;
                name?: string | undefined;
            }>, "many">>;
            ext: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status?: number | undefined;
            id?: string | undefined;
            job_name?: string | undefined;
            create_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            created_at?: string | undefined;
            update_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            updated_at?: string | undefined;
            target_user_count?: number | undefined;
            sent_user_count?: number | undefined;
            read_user_count?: number | undefined;
            send_at?: string | undefined;
            push_content?: string | undefined;
            push_type?: number | undefined;
            push_scope_type?: number | undefined;
            new_staff_scope_type?: number | undefined;
            new_staff_scope_department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            user_list?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }[] | undefined;
            department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            chat_list?: {
                chat_id?: string | undefined;
                name?: string | undefined;
            }[] | undefined;
            ext?: string | undefined;
        }, {
            status?: number | undefined;
            id?: string | undefined;
            job_name?: string | undefined;
            create_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            created_at?: string | undefined;
            update_user?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            } | undefined;
            updated_at?: string | undefined;
            target_user_count?: number | undefined;
            sent_user_count?: number | undefined;
            read_user_count?: number | undefined;
            send_at?: string | undefined;
            push_content?: string | undefined;
            push_type?: number | undefined;
            push_scope_type?: number | undefined;
            new_staff_scope_type?: number | undefined;
            new_staff_scope_department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            user_list?: {
                user_id?: string | undefined;
                name?: string | undefined;
                avatar_url?: string | undefined;
            }[] | undefined;
            department_list?: {
                name?: string | undefined;
                department_id?: string | undefined;
            }[] | undefined;
            chat_list?: {
                chat_id?: string | undefined;
                name?: string | undefined;
            }[] | undefined;
            ext?: string | undefined;
        }>;
        params: z.ZodObject<{
            user_id_type: z.ZodOptional<z.ZodEnum<["open_id", "union_id", "user_id"]>>;
        }, "strip", z.ZodTypeAny, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }, {
            user_id_type?: "user_id" | "open_id" | "union_id" | undefined;
        }>;
        path: z.ZodObject<{
            notification_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notification_id: string;
        }, {
            notification_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1NotificationPreview: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            notification_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notification_id: string;
        }, {
            notification_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1NotificationSubmitApprove: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            reason: string;
        }, {
            reason: string;
        }>;
        path: z.ZodObject<{
            notification_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notification_id: string;
        }, {
            notification_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1TicketCustomizedFieldCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            helpdesk_id: z.ZodOptional<z.ZodString>;
            key_name: z.ZodString;
            display_name: z.ZodString;
            position: z.ZodString;
            field_type: z.ZodString;
            description: z.ZodString;
            visible: z.ZodBoolean;
            editable: z.ZodOptional<z.ZodBoolean>;
            required: z.ZodBoolean;
            dropdown_allow_multiple: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            required: boolean;
            description: string;
            position: string;
            visible: boolean;
            key_name: string;
            display_name: string;
            field_type: string;
            editable?: boolean | undefined;
            helpdesk_id?: string | undefined;
            dropdown_allow_multiple?: boolean | undefined;
        }, {
            required: boolean;
            description: string;
            position: string;
            visible: boolean;
            key_name: string;
            display_name: string;
            field_type: string;
            editable?: boolean | undefined;
            helpdesk_id?: string | undefined;
            dropdown_allow_multiple?: boolean | undefined;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1TicketCustomizedFieldDelete: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            ticket_customized_field_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            ticket_customized_field_id: string;
        }, {
            ticket_customized_field_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1TicketCustomizedFieldGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            ticket_customized_field_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            ticket_customized_field_id: string;
        }, {
            ticket_customized_field_id: string;
        }>;
    };
};
export declare const helpdeskV1TicketCustomizedFieldList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            visible: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            visible?: boolean | undefined;
        }, {
            visible?: boolean | undefined;
        }>;
        params: z.ZodObject<{
            page_token: z.ZodOptional<z.ZodString>;
            page_size: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }, {
            page_size?: number | undefined;
            page_token?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1TicketCustomizedFieldPatch: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            display_name: z.ZodOptional<z.ZodString>;
            position: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            visible: z.ZodOptional<z.ZodBoolean>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            required?: boolean | undefined;
            description?: string | undefined;
            position?: string | undefined;
            visible?: boolean | undefined;
            display_name?: string | undefined;
        }, {
            required?: boolean | undefined;
            description?: string | undefined;
            position?: string | undefined;
            visible?: boolean | undefined;
            display_name?: string | undefined;
        }>;
        path: z.ZodObject<{
            ticket_customized_field_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            ticket_customized_field_id: string;
        }, {
            ticket_customized_field_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1TicketAnswerUserQuery: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            event_id: z.ZodString;
            faqs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                score: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                score?: number | undefined;
                id?: string | undefined;
            }, {
                score?: number | undefined;
                id?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            event_id: string;
            faqs?: {
                score?: number | undefined;
                id?: string | undefined;
            }[] | undefined;
        }, {
            event_id: string;
            faqs?: {
                score?: number | undefined;
                id?: string | undefined;
            }[] | undefined;
        }>;
        path: z.ZodObject<{
            ticket_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            ticket_id: string;
        }, {
            ticket_id: string;
        }>;
    };
};
export declare const helpdeskV1TicketCustomizedFields: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            visible_only: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            visible_only?: boolean | undefined;
        }, {
            visible_only?: boolean | undefined;
        }>;
    };
};
export declare const helpdeskV1TicketGet: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        path: z.ZodObject<{
            ticket_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            ticket_id: string;
        }, {
            ticket_id: string;
        }>;
    };
};
export declare const helpdeskV1TicketList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            ticket_id: z.ZodOptional<z.ZodString>;
            agent_id: z.ZodOptional<z.ZodString>;
            closed_by_id: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodNumber>;
            channel: z.ZodOptional<z.ZodNumber>;
            solved: z.ZodOptional<z.ZodNumber>;
            score: z.ZodOptional<z.ZodNumber>;
            status_list: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            guest_name: z.ZodOptional<z.ZodString>;
            guest_id: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            page: z.ZodOptional<z.ZodNumber>;
            page_size: z.ZodOptional<z.ZodNumber>;
            create_time_start: z.ZodOptional<z.ZodNumber>;
            create_time_end: z.ZodOptional<z.ZodNumber>;
            update_time_start: z.ZodOptional<z.ZodNumber>;
            update_time_end: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type?: number | undefined;
            score?: number | undefined;
            page_size?: number | undefined;
            channel?: number | undefined;
            status_list?: number[] | undefined;
            agent_id?: string | undefined;
            tags?: string[] | undefined;
            ticket_id?: string | undefined;
            closed_by_id?: string | undefined;
            solved?: number | undefined;
            guest_name?: string | undefined;
            guest_id?: string | undefined;
            page?: number | undefined;
            create_time_start?: number | undefined;
            create_time_end?: number | undefined;
            update_time_start?: number | undefined;
            update_time_end?: number | undefined;
        }, {
            type?: number | undefined;
            score?: number | undefined;
            page_size?: number | undefined;
            channel?: number | undefined;
            status_list?: number[] | undefined;
            agent_id?: string | undefined;
            tags?: string[] | undefined;
            ticket_id?: string | undefined;
            closed_by_id?: string | undefined;
            solved?: number | undefined;
            guest_name?: string | undefined;
            guest_id?: string | undefined;
            page?: number | undefined;
            create_time_start?: number | undefined;
            create_time_end?: number | undefined;
            update_time_start?: number | undefined;
            update_time_end?: number | undefined;
        }>;
    };
};
export declare const helpdeskV1TicketMessageCreate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            msg_type: z.ZodString;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
            msg_type: string;
        }, {
            content: string;
            msg_type: string;
        }>;
        path: z.ZodObject<{
            ticket_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            ticket_id?: string | undefined;
        }, {
            ticket_id?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1TicketMessageList: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        params: z.ZodObject<{
            time_start: z.ZodOptional<z.ZodNumber>;
            time_end: z.ZodOptional<z.ZodNumber>;
            page: z.ZodOptional<z.ZodNumber>;
            page_size: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page_size?: number | undefined;
            page?: number | undefined;
            time_start?: number | undefined;
            time_end?: number | undefined;
        }, {
            page_size?: number | undefined;
            page?: number | undefined;
            time_start?: number | undefined;
            time_end?: number | undefined;
        }>;
        path: z.ZodObject<{
            ticket_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            ticket_id?: string | undefined;
        }, {
            ticket_id?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1TicketStartService: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            human_service: z.ZodOptional<z.ZodBoolean>;
            appointed_agents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            open_id: z.ZodString;
            customized_info: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            open_id: string;
            human_service?: boolean | undefined;
            appointed_agents?: string[] | undefined;
            customized_info?: string | undefined;
        }, {
            open_id: string;
            human_service?: boolean | undefined;
            appointed_agents?: string[] | undefined;
            customized_info?: string | undefined;
        }>;
    };
};
export declare const helpdeskV1TicketUpdate: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {
        data: z.ZodObject<{
            status: z.ZodOptional<z.ZodNumber>;
            tag_names: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            comment: z.ZodOptional<z.ZodString>;
            customized_fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                value: z.ZodOptional<z.ZodString>;
                key_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                value?: string | undefined;
                id?: string | undefined;
                key_name?: string | undefined;
            }, {
                value?: string | undefined;
                id?: string | undefined;
                key_name?: string | undefined;
            }>, "many">>;
            ticket_type: z.ZodOptional<z.ZodNumber>;
            solved: z.ZodOptional<z.ZodNumber>;
            channel: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            status?: number | undefined;
            channel?: number | undefined;
            comment?: string | undefined;
            solved?: number | undefined;
            tag_names?: string[] | undefined;
            customized_fields?: {
                value?: string | undefined;
                id?: string | undefined;
                key_name?: string | undefined;
            }[] | undefined;
            ticket_type?: number | undefined;
        }, {
            status?: number | undefined;
            channel?: number | undefined;
            comment?: string | undefined;
            solved?: number | undefined;
            tag_names?: string[] | undefined;
            customized_fields?: {
                value?: string | undefined;
                id?: string | undefined;
                key_name?: string | undefined;
            }[] | undefined;
            ticket_type?: number | undefined;
        }>;
        path: z.ZodObject<{
            ticket_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            ticket_id: string;
        }, {
            ticket_id: string;
        }>;
        useUAT: z.ZodOptional<z.ZodBoolean>;
    };
};
export declare const helpdeskV1Tools: {
    project: string;
    name: string;
    sdkName: string;
    path: string;
    httpMethod: string;
    description: string;
    accessTokens: string[];
    schema: {};
}[];
