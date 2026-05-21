-- ============================================
-- Production Database Index Migration
-- Run on VPS after deploying code changes
-- ============================================

-- ORDERS TABLE (biggest performance impact)
ALTER TABLE `orders` ADD INDEX `orders_status_index` (`status`);
ALTER TABLE `orders` ADD INDEX `orders_phone_index` (`phone`);
ALTER TABLE `orders` ADD INDEX `orders_created_at_index` (`created_at`);
ALTER TABLE `orders` ADD INDEX `orders_status_created_at_index` (`status`, `created_at`);
ALTER TABLE `orders` ADD INDEX `orders_steadfast_consignment_id_index` (`steadfast_consignment_id`);
ALTER TABLE `orders` ADD INDEX `orders_payment_method_index` (`payment_method`);

-- PRODUCTS TABLE
ALTER TABLE `products` ADD INDEX `products_in_stock_is_featured_index` (`in_stock`, `is_featured`);
ALTER TABLE `products` ADD INDEX `products_in_stock_is_new_arrival_index` (`in_stock`, `is_new_arrival`);
ALTER TABLE `products` ADD INDEX `products_in_stock_offer_timer_index` (`in_stock`, `offer_timer`);
ALTER TABLE `products` ADD INDEX `products_created_at_index` (`created_at`);
ALTER TABLE `products` ADD INDEX `products_price_index` (`price`);

-- BANNERS TABLE
ALTER TABLE `banners` ADD INDEX `banners_is_active_position_sort_order_index` (`is_active`, `position`, `sort_order`);

-- CONTACT MESSAGES TABLE
ALTER TABLE `contact_messages` ADD INDEX `contact_messages_is_read_index` (`is_read`);

-- COUPONS TABLE
ALTER TABLE `coupons` ADD INDEX `coupons_is_active_is_global_index` (`is_active`, `is_global`);

-- PAYMENT METHODS TABLE
ALTER TABLE `payment_methods` ADD INDEX `payment_methods_is_active_sort_order_index` (`is_active`, `sort_order`);

-- USERS TABLE
ALTER TABLE `users` ADD INDEX `users_role_index` (`role`);

-- REVIEWS TABLE (composite - individual indexes already exist)
ALTER TABLE `reviews` ADD INDEX `reviews_product_id_is_approved_index` (`product_id`, `is_approved`);
