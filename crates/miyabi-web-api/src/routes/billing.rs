//! Billing and Subscription route handlers
//!
//! Stripe integration for subscription management, usage tracking,
//! and webhook processing.

use crate::{
    error::{AppError, Result},
    middleware::{AuthenticatedUser, OrganizationContext},
    AppState,
};
use axum::{
    body::Bytes,
    extract::{Extension, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// Types
// ============================================================================

/// Subscription plan types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, utoipa::ToSchema)]
#[sqlx(type_name = "subscription_plan", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum SubscriptionPlan {
    Free,
    Pro,
    Enterprise,
}

/// Subscription status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, utoipa::ToSchema)]
#[sqlx(type_name = "subscription_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum SubscriptionStatus {
    Active,
    Canceled,
    PastDue,
    Trialing,
    Unpaid,
}

/// Subscription model
#[derive(Debug, Clone, Serialize, FromRow, utoipa::ToSchema)]
pub struct Subscription {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,
    pub stripe_price_id: Option<String>,
    pub plan: SubscriptionPlan,
    pub status: SubscriptionStatus,
    pub current_period_start: Option<DateTime<Utc>>,
    pub current_period_end: Option<DateTime<Utc>>,
    pub cancel_at_period_end: bool,
    pub canceled_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Plan limits
#[derive(Debug, Clone, Serialize, FromRow, utoipa::ToSchema)]
pub struct PlanLimits {
    pub plan: SubscriptionPlan,
    pub monthly_agent_executions: i32,
    pub monthly_api_calls: i32,
    pub max_organizations: i32,
    pub max_members_per_org: i32,
    pub priority_support: bool,
    pub custom_agents: bool,
    pub advanced_analytics: bool,
}

/// Usage record
#[derive(Debug, Clone, Serialize, FromRow, utoipa::ToSchema)]
pub struct UsageRecord {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub agent_executions: i32,
    pub api_calls: i32,
    pub storage_used_bytes: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Response Types
// ============================================================================

/// Subscription response
#[derive(Serialize, utoipa::ToSchema)]
pub struct SubscriptionResponse {
    pub subscription: Subscription,
    pub limits: PlanLimits,
    pub usage: Option<UsageRecord>,
}

/// Checkout session response
#[derive(Serialize, utoipa::ToSchema)]
pub struct CheckoutSessionResponse {
    pub checkout_url: String,
    pub session_id: String,
}

/// Usage summary response
#[derive(Serialize, utoipa::ToSchema)]
pub struct UsageSummaryResponse {
    pub current_usage: UsageRecord,
    pub limits: PlanLimits,
    pub usage_percentage: UsagePercentage,
}

/// Usage percentage breakdown
#[derive(Serialize, utoipa::ToSchema)]
pub struct UsagePercentage {
    pub agent_executions: f64,
    pub api_calls: f64,
}

// ============================================================================
// Request Types
// ============================================================================

/// Create checkout session request
#[derive(Deserialize, utoipa::ToSchema)]
pub struct CreateCheckoutRequest {
    pub plan: SubscriptionPlan,
    pub success_url: String,
    pub cancel_url: String,
}

/// Cancel subscription request
#[derive(Deserialize, utoipa::ToSchema)]
pub struct CancelSubscriptionRequest {
    pub cancel_at_period_end: bool,
}

// ============================================================================
// Route Handlers
// ============================================================================

/// Get current subscription
#[utoipa::path(
    get,
    path = "/api/v1/billing/subscription",
    tag = "billing",
    responses(
        (status = 200, description = "Current subscription", body = SubscriptionResponse),
        (status = 401, description = "Not authenticated"),
        (status = 404, description = "No subscription found")
    )
)]
pub async fn get_subscription(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthenticatedUser>,
    Extension(org_ctx): Extension<OrganizationContext>,
) -> Result<Json<SubscriptionResponse>> {
    let org_id = org_ctx.organization_id;

    // Get subscription
    let subscription = sqlx::query_as::<_, Subscription>(
        r#"
        SELECT * FROM subscriptions
        WHERE organization_id = $1
        "#,
    )
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?;

    let subscription = match subscription {
        Some(s) => s,
        None => {
            // Create default free subscription
            sqlx::query_as::<_, Subscription>(
                r#"
                INSERT INTO subscriptions (organization_id, plan, status)
                VALUES ($1, 'free', 'active')
                RETURNING *
                "#,
            )
            .bind(org_id)
            .fetch_one(&state.db)
            .await?
        }
    };

    // Get plan limits
    let limits = sqlx::query_as::<_, PlanLimits>(
        r#"SELECT * FROM plan_limits WHERE plan = $1"#,
    )
    .bind(&subscription.plan)
    .fetch_one(&state.db)
    .await?;

    // Get current usage
    let usage = sqlx::query_as::<_, UsageRecord>(
        r#"
        SELECT * FROM usage_records
        WHERE organization_id = $1
          AND period_start <= NOW()
          AND period_end >= NOW()
        "#,
    )
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(SubscriptionResponse {
        subscription,
        limits,
        usage,
    }))
}

/// Create Stripe checkout session
#[utoipa::path(
    post,
    path = "/api/v1/billing/checkout",
    tag = "billing",
    request_body = CreateCheckoutRequest,
    responses(
        (status = 200, description = "Checkout session created", body = CheckoutSessionResponse),
        (status = 401, description = "Not authenticated"),
        (status = 400, description = "Invalid request")
    )
)]
pub async fn create_checkout_session(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthenticatedUser>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Json(request): Json<CreateCheckoutRequest>,
) -> Result<Json<CheckoutSessionResponse>> {
    let org_id = org_ctx.organization_id;

    // Get Stripe price ID for the plan
    let price_id = match request.plan {
        SubscriptionPlan::Free => {
            return Err(AppError::Validation(
                "Cannot checkout for free plan".to_string(),
            ));
        }
        SubscriptionPlan::Pro => std::env::var("STRIPE_PRICE_ID_PRO")
            .unwrap_or_else(|_| "price_pro_monthly".to_string()),
        SubscriptionPlan::Enterprise => std::env::var("STRIPE_PRICE_ID_ENTERPRISE")
            .unwrap_or_else(|_| "price_enterprise_monthly".to_string()),
    };

    // Get or create Stripe customer
    let subscription = sqlx::query_as::<_, Subscription>(
        r#"SELECT * FROM subscriptions WHERE organization_id = $1"#,
    )
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?;

    let customer_id = match subscription {
        Some(s) if s.stripe_customer_id.is_some() => s.stripe_customer_id.unwrap(),
        _ => {
            // TODO: Create Stripe customer via API
            // For now, return a placeholder
            format!("cus_{}", Uuid::new_v4().simple())
        }
    };

    // TODO: Create actual Stripe checkout session
    // For now, return placeholder response
    let session_id = format!("cs_{}", Uuid::new_v4().simple());
    let checkout_url = format!(
        "https://checkout.stripe.com/c/pay/{}?success_url={}&cancel_url={}",
        session_id,
        urlencoding::encode(&request.success_url),
        urlencoding::encode(&request.cancel_url)
    );

    // Store pending checkout in subscription
    sqlx::query(
        r#"
        INSERT INTO subscriptions (organization_id, stripe_customer_id, stripe_price_id, plan, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (organization_id) DO UPDATE SET
            stripe_customer_id = EXCLUDED.stripe_customer_id,
            stripe_price_id = EXCLUDED.stripe_price_id,
            updated_at = NOW()
        "#,
    )
    .bind(org_id)
    .bind(&customer_id)
    .bind(&price_id)
    .bind(&request.plan)
    .execute(&state.db)
    .await?;

    Ok(Json(CheckoutSessionResponse {
        checkout_url,
        session_id,
    }))
}

/// Get usage summary
#[utoipa::path(
    get,
    path = "/api/v1/billing/usage",
    tag = "billing",
    responses(
        (status = 200, description = "Usage summary", body = UsageSummaryResponse),
        (status = 401, description = "Not authenticated")
    )
)]
pub async fn get_usage(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthenticatedUser>,
    Extension(org_ctx): Extension<OrganizationContext>,
) -> Result<Json<UsageSummaryResponse>> {
    let org_id = org_ctx.organization_id;

    // Get or create current usage record
    let usage = sqlx::query_as::<_, UsageRecord>(
        r#"
        INSERT INTO usage_records (organization_id, period_start, period_end)
        VALUES ($1, date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month')
        ON CONFLICT (organization_id, period_start) DO UPDATE SET updated_at = NOW()
        RETURNING *
        "#,
    )
    .bind(org_id)
    .fetch_one(&state.db)
    .await?;

    // Get subscription plan
    let subscription = sqlx::query_as::<_, Subscription>(
        r#"SELECT * FROM subscriptions WHERE organization_id = $1"#,
    )
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?;

    let plan = subscription
        .map(|s| s.plan)
        .unwrap_or(SubscriptionPlan::Free);

    // Get limits
    let limits = sqlx::query_as::<_, PlanLimits>(
        r#"SELECT * FROM plan_limits WHERE plan = $1"#,
    )
    .bind(&plan)
    .fetch_one(&state.db)
    .await?;

    // Calculate usage percentage
    let agent_pct = if limits.monthly_agent_executions < 0 {
        0.0
    } else {
        (usage.agent_executions as f64 / limits.monthly_agent_executions as f64) * 100.0
    };

    let api_pct = if limits.monthly_api_calls < 0 {
        0.0
    } else {
        (usage.api_calls as f64 / limits.monthly_api_calls as f64) * 100.0
    };

    Ok(Json(UsageSummaryResponse {
        current_usage: usage,
        limits,
        usage_percentage: UsagePercentage {
            agent_executions: agent_pct,
            api_calls: api_pct,
        },
    }))
}

/// Cancel subscription
#[utoipa::path(
    post,
    path = "/api/v1/billing/cancel",
    tag = "billing",
    request_body = CancelSubscriptionRequest,
    responses(
        (status = 200, description = "Subscription canceled", body = Subscription),
        (status = 401, description = "Not authenticated"),
        (status = 404, description = "No subscription found")
    )
)]
pub async fn cancel_subscription(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthenticatedUser>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Json(request): Json<CancelSubscriptionRequest>,
) -> Result<Json<Subscription>> {
    let org_id = org_ctx.organization_id;

    // Update subscription
    let subscription = if request.cancel_at_period_end {
        sqlx::query_as::<_, Subscription>(
            r#"
            UPDATE subscriptions
            SET cancel_at_period_end = TRUE, updated_at = NOW()
            WHERE organization_id = $1
            RETURNING *
            "#,
        )
        .bind(org_id)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Subscription>(
            r#"
            UPDATE subscriptions
            SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
            WHERE organization_id = $1
            RETURNING *
            "#,
        )
        .bind(org_id)
        .fetch_one(&state.db)
        .await?
    };

    // TODO: Cancel subscription in Stripe

    Ok(Json(subscription))
}

// ============================================================================
// Stripe Webhook
// ============================================================================

/// Stripe webhook event types we handle
#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StripeEventType {
    #[serde(rename = "checkout.session.completed")]
    CheckoutSessionCompleted,
    #[serde(rename = "customer.subscription.created")]
    SubscriptionCreated,
    #[serde(rename = "customer.subscription.updated")]
    SubscriptionUpdated,
    #[serde(rename = "customer.subscription.deleted")]
    SubscriptionDeleted,
    #[serde(rename = "invoice.paid")]
    InvoicePaid,
    #[serde(rename = "invoice.payment_failed")]
    InvoicePaymentFailed,
    #[serde(other)]
    Unknown,
}

/// Stripe webhook event
#[derive(Debug, Deserialize)]
pub struct StripeEvent {
    pub id: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub data: serde_json::Value,
}

/// Stripe webhook handler
///
/// Note: No utoipa annotation as webhook uses raw Bytes body
pub async fn stripe_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<impl IntoResponse> {
    // Get signature from header
    let signature = headers
        .get("stripe-signature")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Validation("Missing Stripe signature".to_string()))?;

    // Verify signature
    let webhook_secret =
        std::env::var("STRIPE_WEBHOOK_SECRET").unwrap_or_else(|_| "whsec_test".to_string());

    verify_stripe_signature(&body, signature, &webhook_secret)?;

    // Parse event
    let event: StripeEvent = serde_json::from_slice(&body)
        .map_err(|e| AppError::Validation(format!("Invalid event payload: {}", e)))?;

    // Check if already processed (idempotency)
    let already_processed = sqlx::query_scalar::<_, bool>(
        r#"SELECT processed FROM stripe_events WHERE stripe_event_id = $1"#,
    )
    .bind(&event.id)
    .fetch_optional(&state.db)
    .await?
    .unwrap_or(false);

    if already_processed {
        return Ok(StatusCode::OK);
    }

    // Store event
    sqlx::query(
        r#"
        INSERT INTO stripe_events (stripe_event_id, event_type, payload)
        VALUES ($1, $2, $3)
        ON CONFLICT (stripe_event_id) DO NOTHING
        "#,
    )
    .bind(&event.id)
    .bind(&event.event_type)
    .bind(&event.data)
    .execute(&state.db)
    .await?;

    // Process event
    let result = process_stripe_event(&state.db, &event).await;

    // Mark as processed
    let (processed, error_message) = match result {
        Ok(()) => (true, None),
        Err(e) => (false, Some(e.to_string())),
    };

    sqlx::query(
        r#"
        UPDATE stripe_events
        SET processed = $2, processed_at = NOW(), error_message = $3
        WHERE stripe_event_id = $1
        "#,
    )
    .bind(&event.id)
    .bind(processed)
    .bind(error_message)
    .execute(&state.db)
    .await?;

    Ok(StatusCode::OK)
}

/// Verify Stripe webhook signature
fn verify_stripe_signature(payload: &[u8], signature: &str, secret: &str) -> Result<()> {
    // Parse signature header
    let parts: std::collections::HashMap<_, _> = signature
        .split(',')
        .filter_map(|part| {
            let mut kv = part.splitn(2, '=');
            Some((kv.next()?, kv.next()?))
        })
        .collect();

    let timestamp = parts
        .get("t")
        .ok_or_else(|| AppError::Validation("Missing timestamp".to_string()))?;

    let signatures: Vec<&str> = parts
        .iter()
        .filter(|(k, _)| k.starts_with("v1"))
        .map(|(_, v)| *v)
        .collect();

    if signatures.is_empty() {
        return Err(AppError::Validation("Missing v1 signature".to_string()));
    }

    // Create signed payload
    let signed_payload = format!("{}.{}", timestamp, String::from_utf8_lossy(payload));

    // Compute expected signature
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Validation("Invalid webhook secret".to_string()))?;
    mac.update(signed_payload.as_bytes());
    let expected = hex::encode(mac.finalize().into_bytes());

    // Check if any signature matches
    if !signatures.iter().any(|sig| *sig == expected) {
        return Err(AppError::Validation("Invalid signature".to_string()));
    }

    Ok(())
}

/// Process Stripe event
async fn process_stripe_event(db: &sqlx::PgPool, event: &StripeEvent) -> Result<()> {
    tracing::info!("Processing Stripe event: {} ({})", event.id, event.event_type);

    match event.event_type.as_str() {
        "checkout.session.completed" => {
            // Extract customer and subscription info from event data
            if let Some(object) = event.data.get("object") {
                let customer_id = object.get("customer").and_then(|v| v.as_str());
                let subscription_id = object.get("subscription").and_then(|v| v.as_str());

                if let (Some(customer_id), Some(subscription_id)) = (customer_id, subscription_id) {
                    // Update subscription with Stripe IDs
                    sqlx::query(
                        r#"
                        UPDATE subscriptions
                        SET stripe_subscription_id = $1, status = 'active', updated_at = NOW()
                        WHERE stripe_customer_id = $2
                        "#,
                    )
                    .bind(subscription_id)
                    .bind(customer_id)
                    .execute(db)
                    .await?;
                }
            }
        }
        "customer.subscription.updated" => {
            if let Some(object) = event.data.get("object") {
                let subscription_id = object.get("id").and_then(|v| v.as_str());
                let status = object.get("status").and_then(|v| v.as_str());
                let cancel_at_period_end = object
                    .get("cancel_at_period_end")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);

                if let (Some(subscription_id), Some(status)) = (subscription_id, status) {
                    let db_status = match status {
                        "active" => SubscriptionStatus::Active,
                        "canceled" => SubscriptionStatus::Canceled,
                        "past_due" => SubscriptionStatus::PastDue,
                        "trialing" => SubscriptionStatus::Trialing,
                        "unpaid" => SubscriptionStatus::Unpaid,
                        _ => SubscriptionStatus::Active,
                    };

                    sqlx::query(
                        r#"
                        UPDATE subscriptions
                        SET status = $2, cancel_at_period_end = $3, updated_at = NOW()
                        WHERE stripe_subscription_id = $1
                        "#,
                    )
                    .bind(subscription_id)
                    .bind(db_status)
                    .bind(cancel_at_period_end)
                    .execute(db)
                    .await?;
                }
            }
        }
        "customer.subscription.deleted" => {
            if let Some(object) = event.data.get("object") {
                let subscription_id = object.get("id").and_then(|v| v.as_str());

                if let Some(subscription_id) = subscription_id {
                    // Downgrade to free plan
                    sqlx::query(
                        r#"
                        UPDATE subscriptions
                        SET plan = 'free', status = 'canceled', canceled_at = NOW(), updated_at = NOW()
                        WHERE stripe_subscription_id = $1
                        "#,
                    )
                    .bind(subscription_id)
                    .execute(db)
                    .await?;
                }
            }
        }
        "invoice.paid" => {
            if let Some(object) = event.data.get("object") {
                let invoice_id = object.get("id").and_then(|v| v.as_str());
                let subscription_id = object.get("subscription").and_then(|v| v.as_str());
                let amount_paid = object.get("amount_paid").and_then(|v| v.as_i64()).unwrap_or(0);
                let hosted_url = object.get("hosted_invoice_url").and_then(|v| v.as_str());
                let pdf_url = object.get("invoice_pdf").and_then(|v| v.as_str());

                if let Some(invoice_id) = invoice_id {
                    // Get organization from subscription
                    let org_id: Option<Uuid> = if let Some(sub_id) = subscription_id {
                        sqlx::query_scalar(
                            r#"SELECT organization_id FROM subscriptions WHERE stripe_subscription_id = $1"#,
                        )
                        .bind(sub_id)
                        .fetch_optional(db)
                        .await?
                    } else {
                        None
                    };

                    if let Some(org_id) = org_id {
                        sqlx::query(
                            r#"
                            INSERT INTO invoices (
                                organization_id, stripe_invoice_id, amount_due, amount_paid,
                                status, hosted_invoice_url, invoice_pdf_url, paid_at
                            ) VALUES ($1, $2, $3, $3, 'paid', $4, $5, NOW())
                            ON CONFLICT (stripe_invoice_id) DO UPDATE SET
                                amount_paid = EXCLUDED.amount_paid,
                                status = 'paid',
                                paid_at = NOW(),
                                updated_at = NOW()
                            "#,
                        )
                        .bind(org_id)
                        .bind(invoice_id)
                        .bind(amount_paid as i32)
                        .bind(hosted_url)
                        .bind(pdf_url)
                        .execute(db)
                        .await?;
                    }
                }
            }
        }
        "invoice.payment_failed" => {
            if let Some(object) = event.data.get("object") {
                let subscription_id = object.get("subscription").and_then(|v| v.as_str());

                if let Some(subscription_id) = subscription_id {
                    sqlx::query(
                        r#"
                        UPDATE subscriptions
                        SET status = 'past_due', updated_at = NOW()
                        WHERE stripe_subscription_id = $1
                        "#,
                    )
                    .bind(subscription_id)
                    .execute(db)
                    .await?;
                }
            }
        }
        _ => {
            tracing::debug!("Unhandled Stripe event type: {}", event.event_type);
        }
    }

    Ok(())
}

// ============================================================================
// Usage Tracking Functions
// ============================================================================

/// Track an agent execution
pub async fn track_agent_execution(
    db: &sqlx::PgPool,
    org_id: Uuid,
    user_id: Option<Uuid>,
    agent_type: &str,
) -> Result<bool> {
    // Check limit first
    let within_limit: bool = sqlx::query_scalar(
        r#"SELECT check_usage_limit($1, 'agent_executions')"#,
    )
    .bind(org_id)
    .fetch_one(db)
    .await?;

    if !within_limit {
        return Ok(false);
    }

    // Increment usage
    sqlx::query(r#"SELECT increment_usage($1, 'agent_executions', 1)"#)
        .bind(org_id)
        .execute(db)
        .await?;

    // Record event
    sqlx::query(
        r#"
        INSERT INTO usage_events (organization_id, user_id, event_type, agent_type)
        VALUES ($1, $2, 'agent_execution', $3)
        "#,
    )
    .bind(org_id)
    .bind(user_id)
    .bind(agent_type)
    .execute(db)
    .await?;

    Ok(true)
}

/// Track an API call
pub async fn track_api_call(db: &sqlx::PgPool, org_id: Uuid) -> Result<bool> {
    // Check limit first
    let within_limit: bool = sqlx::query_scalar(
        r#"SELECT check_usage_limit($1, 'api_calls')"#,
    )
    .bind(org_id)
    .fetch_one(db)
    .await?;

    if !within_limit {
        return Ok(false);
    }

    // Increment usage
    sqlx::query(r#"SELECT increment_usage($1, 'api_calls', 1)"#)
        .bind(org_id)
        .execute(db)
        .await?;

    Ok(true)
}

// ============================================================================
// Router
// ============================================================================

/// Create billing routes
pub fn billing_routes() -> Router<AppState> {
    Router::new()
        .route("/subscription", get(get_subscription))
        .route("/checkout", post(create_checkout_session))
        .route("/usage", get(get_usage))
        .route("/cancel", post(cancel_subscription))
        .route("/webhook", post(stripe_webhook))
}
