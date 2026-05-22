-- Add unique constraint on stripe_subscription_id so upsert ON CONFLICT works correctly.
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_stripe_subscription_id_key
  UNIQUE (stripe_subscription_id);
