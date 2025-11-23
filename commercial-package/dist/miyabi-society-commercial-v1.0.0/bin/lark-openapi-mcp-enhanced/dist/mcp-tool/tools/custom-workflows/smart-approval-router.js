"use strict";
/**
 * =============================================================================
 * Smart Approval Router Workflow Tool
 * =============================================================================
 * Intelligent approval routing with load balancing and escalation management
 * Priority 1: Critical workflow for reducing approval bottlenecks
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartApprovalRouter = void 0;
const zod_1 = require("zod");
// Approval request schema
const ApprovalRequestSchema = zod_1.z.object({
    // Request details
    request: zod_1.z.object({
        title: zod_1.z.string().describe('Approval request title'),
        description: zod_1.z.string().describe('Detailed description of what needs approval'),
        category: zod_1.z.enum([
            'budget', 'expense', 'hiring', 'contract', 'project', 'policy',
            'equipment', 'travel', 'training', 'overtime', 'leave', 'other'
        ]).describe('Category of approval request'),
        amount: zod_1.z.number().optional().describe('Amount in currency (if applicable)'),
        currency: zod_1.z.string().default('JPY').describe('Currency code'),
        priority: zod_1.z.enum(['low', 'normal', 'high', 'urgent']).default('normal').describe('Request priority'),
        deadline: zod_1.z.string().optional().describe('Required approval deadline (YYYY-MM-DD)'),
        attachments: zod_1.z.array(zod_1.z.string()).optional().describe('File tokens for supporting documents'),
    }),
    // Requester information
    requester: zod_1.z.object({
        email: zod_1.z.string().email().describe('Requester email address'),
        department: zod_1.z.string().describe('Requester department'),
        employee_id: zod_1.z.string().optional().describe('Employee ID'),
        cost_center: zod_1.z.string().optional().describe('Cost center code'),
    }),
    // Routing preferences
    routing: zod_1.z.object({
        auto_select_approver: zod_1.z.boolean().default(true).describe('Automatically select optimal approver'),
        preferred_approver_email: zod_1.z.string().email().optional().describe('Preferred approver (if known)'),
        require_secondary_approval: zod_1.z.boolean().default(false).describe('Require additional approval for high-value items'),
        enable_parallel_approval: zod_1.z.boolean().default(false).describe('Enable parallel approval for multiple approvers'),
        escalation_enabled: zod_1.z.boolean().default(true).describe('Enable automatic escalation'),
        escalation_hours: zod_1.z.number().default(24).describe('Hours before escalation'),
    }),
    // Business rules
    business_rules: zod_1.z.object({
        apply_spending_limits: zod_1.z.boolean().default(true).describe('Apply departmental spending limits'),
        require_budget_validation: zod_1.z.boolean().default(true).describe('Validate against budget'),
        check_policy_compliance: zod_1.z.boolean().default(true).describe('Check against company policies'),
        require_justification: zod_1.z.boolean().default(false).describe('Require detailed justification'),
    })
});
/**
 * Smart Approval Router Tool
 * Intelligently routes approval requests to optimal approvers with load balancing
 */
exports.smartApprovalRouter = {
    project: 'custom_workflows',
    name: 'approval.smart_router.process',
    accessTokens: ['tenant'],
    description: '[Custom Workflow] Smart approval routing with load balancing, escalation management, and compliance checking',
    schema: {
        data: ApprovalRequestSchema
    },
    customHandler: async (client, params) => {
        var _a, _b, _c, _d, _e, _f;
        const startTime = Date.now();
        const results = {
            success: false,
            approval_request_id: '',
            routing_decisions: [],
            selected_approvers: [],
            compliance_checks: {},
            escalation_plan: {},
            notifications_sent: [],
            timeline: {}
        };
        try {
            console.log('🔀 Starting Smart Approval Routing:', params.request.title);
            // Step 1: Get requester information
            const requesterResponse = await client.contact.user.batchGetId({
                data: { emails: [params.requester.email] },
                params: { user_id_type: 'open_id' }
            });
            const requesterId = (_c = (_b = (_a = requesterResponse.data) === null || _a === void 0 ? void 0 : _a.user_list) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.user_id;
            if (!requesterId) {
                throw new Error(`Requester ${params.requester.email} not found in system`);
            }
            // Step 2: Determine approval authority based on category and amount
            const approvalMatrix = await determineApprovalAuthority(params.request.category, params.request.amount || 0, params.requester.department);
            results.routing_decisions.push(`approval_authority_determined: ${approvalMatrix.authority_level}`);
            // Step 3: Find available approvers
            let availableApprovers = [];
            if (params.routing.auto_select_approver) {
                // Auto-select based on workload and availability
                availableApprovers = await findOptimalApprovers(client, approvalMatrix.required_roles, params.requester.department, params.request.priority);
                results.routing_decisions.push(`auto_selected_approvers: ${availableApprovers.length} candidates found`);
            }
            else if (params.routing.preferred_approver_email) {
                // Use preferred approver if specified
                const preferredApproverResponse = await client.contact.user.batchGetId({
                    data: { emails: [params.routing.preferred_approver_email] },
                    params: { user_id_type: 'open_id' }
                });
                const preferredApproverId = (_f = (_e = (_d = preferredApproverResponse.data) === null || _d === void 0 ? void 0 : _d.user_list) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.user_id;
                if (preferredApproverId) {
                    availableApprovers = [{
                            user_id: preferredApproverId,
                            email: params.routing.preferred_approver_email,
                            workload_score: 0,
                            selection_reason: 'preferred_by_requester'
                        }];
                }
            }
            if (availableApprovers.length === 0) {
                throw new Error('No available approvers found for this request');
            }
            // Step 4: Run compliance checks
            if (params.business_rules.check_policy_compliance) {
                results.compliance_checks = await runComplianceChecks(params.request.category, params.request.amount || 0, params.requester.department, params.requester.cost_center);
                // Check if any compliance issues block the request
                const complianceIssues = Object.entries(results.compliance_checks)
                    .filter(([_, passed]) => !passed)
                    .map(([check, _]) => check);
                if (complianceIssues.length > 0) {
                    results.routing_decisions.push(`compliance_issues_found: ${complianceIssues.join(', ')}`);
                    // Auto-escalate compliance issues
                    availableApprovers = await findComplianceOfficers(client, params.requester.department);
                }
            }
            // Step 5: Create approval request in system
            const approvalRequest = await createApprovalRequest(client, params, requesterId, availableApprovers[0].user_id, results.compliance_checks);
            results.approval_request_id = approvalRequest.approval_id;
            results.selected_approvers = availableApprovers.slice(0, params.routing.enable_parallel_approval ? 2 : 1);
            // Step 6: Set up escalation timeline
            if (params.routing.escalation_enabled) {
                const escalationDate = new Date();
                escalationDate.setHours(escalationDate.getHours() + params.routing.escalation_hours);
                results.escalation_plan = {
                    primary_deadline: escalationDate.toISOString(),
                    escalation_to: availableApprovers.length > 1 ? availableApprovers[1].email : 'department_head',
                    escalation_reason: 'primary_approver_timeout'
                };
                results.timeline['escalation_deadline'] = escalationDate.toISOString().split('T')[0];
            }
            // Step 7: Send approval notifications
            for (const approver of results.selected_approvers) {
                const approvalNotification = createApprovalNotification(params, approver, results.approval_request_id, results.compliance_checks);
                try {
                    await client.im.message.create({
                        data: {
                            receive_id: approver.user_id,
                            content: JSON.stringify({
                                text: approvalNotification.message,
                                card: approvalNotification.card
                            }),
                            msg_type: 'interactive'
                        },
                        params: { receive_id_type: 'open_id' }
                    });
                    results.notifications_sent.push(`approval_request_${approver.email}`);
                }
                catch (error) {
                    console.error(`Failed to send notification to ${approver.email}:`, error);
                }
            }
            // Step 8: Notify requester
            const requesterNotification = `📋 Approval Request Submitted Successfully

Request: ${params.request.title}
Request ID: ${results.approval_request_id}
Category: ${params.request.category}
${params.request.amount ? `Amount: ${params.request.amount} ${params.request.currency}` : ''}

Routed to: ${results.selected_approvers.map(a => a.email).join(', ')}
Priority: ${params.request.priority}
${params.request.deadline ? `Deadline: ${params.request.deadline}` : ''}

Compliance Status:
${Object.entries(results.compliance_checks).map(([check, passed]) => `• ${check}: ${passed ? '✅' : '❌'}`).join('\\n')}

${params.routing.escalation_enabled ?
                `⏰ Auto-escalation in ${params.routing.escalation_hours} hours if no response` : ''}

You will be notified when a decision is made.`;
            try {
                await client.im.message.create({
                    data: {
                        receive_id: requesterId,
                        content: JSON.stringify({
                            text: requesterNotification
                        }),
                        msg_type: 'text'
                    },
                    params: { receive_id_type: 'open_id' }
                });
                results.notifications_sent.push('requester_confirmation');
            }
            catch (error) {
                console.error('Failed to send requester notification:', error);
            }
            results.success = true;
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                data: {
                    approval_request_id: results.approval_request_id,
                    selected_approvers: results.selected_approvers.map(a => ({
                        email: a.email,
                        selection_reason: a.selection_reason,
                        workload_score: a.workload_score
                    })),
                    routing_decisions: results.routing_decisions,
                    compliance_status: results.compliance_checks,
                    escalation_plan: results.escalation_plan,
                    timeline: results.timeline,
                    execution_time_ms: executionTime
                },
                message: `✅ Approval request routed successfully to ${results.selected_approvers.length} approver(s). Request ID: ${results.approval_request_id}`
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            return {
                success: false,
                error: {
                    message: 'Smart approval routing failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    partial_results: results,
                    execution_time_ms: executionTime
                }
            };
        }
    }
};
// Helper functions
async function determineApprovalAuthority(category, amount, department) {
    // Approval matrix logic
    const approvalMatrix = {
        budget: {
            low: { max_amount: 100000, roles: ['team_lead'] },
            medium: { max_amount: 500000, roles: ['department_manager'] },
            high: { max_amount: 2000000, roles: ['director'] },
            executive: { max_amount: Infinity, roles: ['cfo', 'ceo'] }
        },
        expense: {
            low: { max_amount: 50000, roles: ['team_lead'] },
            medium: { max_amount: 200000, roles: ['department_manager'] },
            high: { max_amount: 1000000, roles: ['director'] },
            executive: { max_amount: Infinity, roles: ['cfo'] }
        },
        hiring: {
            low: { max_amount: Infinity, roles: ['hr_manager', 'department_manager'] },
            high: { max_amount: Infinity, roles: ['director', 'hr_director'] }
        },
        contract: {
            medium: { max_amount: 1000000, roles: ['legal_counsel'] },
            high: { max_amount: Infinity, roles: ['legal_director', 'ceo'] }
        }
    };
    const categoryMatrix = approvalMatrix[category] || approvalMatrix.expense;
    for (const [level, config] of Object.entries(categoryMatrix)) {
        if (amount <= config.max_amount) {
            return {
                authority_level: level,
                required_roles: config.roles
            };
        }
    }
    return {
        authority_level: 'executive',
        required_roles: ['ceo']
    };
}
async function findOptimalApprovers(client, requiredRoles, department, priority) {
    // Simulated approver selection logic
    // In real implementation, this would query employee database and calculate workload
    const mockApprovers = [
        {
            user_id: 'ou_example_manager_1',
            email: 'manager1@company.com',
            role: 'department_manager',
            department: department,
            workload_score: 3, // Lower is better
            selection_reason: 'lowest_workload_in_department'
        },
        {
            user_id: 'ou_example_manager_2',
            email: 'manager2@company.com',
            role: 'department_manager',
            department: department,
            workload_score: 5,
            selection_reason: 'backup_approver'
        }
    ];
    // Sort by workload score (lower is better)
    return mockApprovers
        .filter(approver => requiredRoles.some(role => approver.role.includes(role)))
        .sort((a, b) => a.workload_score - b.workload_score);
}
async function runComplianceChecks(category, amount, department, costCenter) {
    // Simulated compliance checking
    return {
        budget_available: amount < 500000, // Simplified budget check
        policy_compliant: true,
        authorization_valid: true,
        documentation_complete: true,
        spending_limit_ok: amount < 1000000,
        cost_center_valid: !!costCenter
    };
}
async function findComplianceOfficers(client, department) {
    // Simulated compliance officer lookup
    return [
        {
            user_id: 'ou_compliance_officer',
            email: 'compliance@company.com',
            role: 'compliance_officer',
            workload_score: 0,
            selection_reason: 'compliance_escalation'
        }
    ];
}
async function createApprovalRequest(client, params, requesterId, approverId, complianceChecks) {
    // In real implementation, this would create a record in approval tracking system
    // For now, we simulate by creating a Base record
    const approvalId = `APR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Could create record in approval tracking Base here
    return { approval_id: approvalId };
}
function createApprovalNotification(params, approver, approvalId, complianceChecks) {
    const complianceStatus = Object.entries(complianceChecks)
        .map(([check, passed]) => `${check}: ${passed ? '✅' : '❌'}`)
        .join('\\n');
    const message = `🔔 Approval Request - ${params.request.priority.toUpperCase()} Priority

Title: ${params.request.title}
Requester: ${params.requester.email}
Category: ${params.request.category}
${params.request.amount ? `Amount: ${params.request.amount} ${params.request.currency}` : ''}
Department: ${params.requester.department}

Description:
${params.request.description}

Compliance Status:
${complianceStatus}

Request ID: ${approvalId}
Selected as: ${approver.selection_reason}

Please review and approve/reject this request.`;
    // Interactive card for approval actions
    const card = {
        type: 'template',
        data: {
            template_id: 'approval_card_template',
            template_variable: {
                title: params.request.title,
                amount: params.request.amount,
                requester: params.requester.email,
                approval_id: approvalId
            }
        }
    };
    return { message, card };
}
