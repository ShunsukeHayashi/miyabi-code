-- Rollback: Stripe Billing Integration Schema

-- Drop triggers
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS update_usage_records_updated_at ON usage_records;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Drop functions
DROP FUNCTION IF EXISTS increment_usage;
DROP FUNCTION IF EXISTS check_usage_limit;
DROP FUNCTION IF EXISTS get_current_usage;

-- Drop tables
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS stripe_events;
DROP TABLE IF EXISTS usage_events;
DROP TABLE IF EXISTS usage_records;
DROP TABLE IF EXISTS plan_limits;
DROP TABLE IF EXISTS subscriptions;

-- Drop types
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS subscription_plan;
