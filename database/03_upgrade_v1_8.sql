-- InfraOS v1.8 - ajustes incrementais para consultas de operação
create index if not exists idx_service_orders_opened_at on service_orders(opened_at);
create index if not exists idx_service_orders_updated_at on service_orders(updated_at);
create index if not exists idx_service_orders_order_number on service_orders(order_number);
