-- Migration 119: Add 'paid' to gift_orders.status check constraint
-- Stripe webhook marks gift orders as 'paid' after PaymentIntent succeeds

ALTER TABLE gift_orders
  DROP CONSTRAINT IF EXISTS gift_orders_status_check;

ALTER TABLE gift_orders
  ADD CONSTRAINT gift_orders_status_check
  CHECK (status IN ('pending','processing','shipped','delivered','cancelled','paid'));
