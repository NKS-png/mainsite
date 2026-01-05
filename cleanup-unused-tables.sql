-- CLEANUP UNUSED TABLES
-- This script removes all order, cart, product, and request-related tables
-- that are no longer needed after converting to a personal creator site

-- Drop tables in correct dependency order (child tables first)

-- Drop cart-related tables
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- Drop order-related tables
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS order_files CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Drop product catalog
DROP TABLE IF EXISTS products CASCADE;

-- Drop project requests (no longer accepting direct requests)
DROP TABLE IF EXISTS project_requests CASCADE;

-- Optional: Clean up any orphaned data in uploads table
-- Remove any references to deleted buckets if they exist
-- Note: Keep the uploads table for portfolio items

-- Remove RLS policies for deleted tables (these will be automatically dropped with CASCADE)
-- But let's be explicit about what we're cleaning up

-- Note: The following tables are kept:
-- - profiles (for user management)
-- - uploads (for portfolio items)
-- - auth.users (managed by Supabase Auth)

COMMIT;