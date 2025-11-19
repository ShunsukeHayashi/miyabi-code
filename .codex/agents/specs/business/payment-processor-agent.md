# PaymentProcessorAgent (Codex)

**Agent ID**: 204 | **Type**: Business | **Priority**: P0

## 🎯 Purpose
Handle payment transaction processing, validation, and reconciliation.

## 📋 Spec

| Property | Value |
|----------|-------|
| Input | Order ID, payment method, amount |
| Output | Transaction result (success/failure) |
| Duration | 1-3 seconds |
| Dependencies | Stripe API, PostgreSQL |

## 💻 Implementation

```rust
pub struct PaymentProcessorAgent {
    stripe_client: Arc<StripeClient>,
    state_manager: Arc<StateManager>,
    db_pool: PgPool,
}

impl Agent for PaymentProcessorAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, AgentError> {
        let payment_request: PaymentRequest = parse_request(task)?;

        // 1. Validate order
        let order = self.validate_order(&payment_request.order_id).await?;

        // 2. Process payment via Stripe
        let charge = self.stripe_client
            .create_charge(
                payment_request.amount,
                payment_request.currency,
                payment_request.payment_method,
            )
            .await?;

        // 3. Update order status
        sqlx::query!(
            "UPDATE orders SET status = 'completed', payment_id = $1 WHERE id = $2",
            charge.id, order.id
        )
        .execute(&self.db_pool)
        .await?;

        // 4. Update state
        self.state_manager.update_business_state(|state| {
            if let Some(order) = state.orders.iter_mut().find(|o| o.id == order.id) {
                order.status = OrderStatus::Completed;
                order.completed_at = Some(Utc::now());
            }
        }).await?;

        Ok(AgentResult::success())
    }
}
```

## 🚨 Security
- PCI DSS compliance required
- Never log full card numbers
- Use Stripe tokenization
- Implement idempotency keys

## 🔗 Related
- Stripe API documentation
- `crates/miyabi-business-api/src/payments.rs`

**Phase**: 4 | **Effort**: 3 days
