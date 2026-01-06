-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('animation', 'artwork', 'video_editing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- Optional for guest orders
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_title TEXT NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order files table
CREATE TABLE order_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  original_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Uploads table
CREATE TABLE uploads (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES auth.users(id),
   bucket TEXT NOT NULL CHECK (bucket IN ('animation', 'artwork', 'video_editing')),
   path TEXT NOT NULL,
   filename TEXT NOT NULL,
   mime TEXT NOT NULL,
   size BIGINT NOT NULL,
   public BOOLEAN DEFAULT TRUE,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 );

-- Comments table
CREATE TABLE comments (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES auth.users(id) NOT NULL,
   content TEXT NOT NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 );

-- RLS Policies

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Products: Public read, admin insert/update/delete
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Orders: Users can view own orders, guests can view orders by email, admin can view all
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Guests view own orders by email" ON orders FOR SELECT USING (
  auth.uid() IS NULL AND customer_email IS NOT NULL
);
CREATE POLICY "Admin view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Anyone create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Order files: Users can view own order files, admin can view all
CREATE POLICY "Users view own order files" ON order_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_files.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admin view all order files" ON order_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users create own order files" ON order_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_files.order_id AND user_id = auth.uid())
);

-- Order items: Same as orders
CREATE POLICY "Users view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admin view all order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users create own order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- Uploads: Public read for public uploads, admin manage all
CREATE POLICY "Public read public uploads" ON uploads FOR SELECT USING (public = true);
CREATE POLICY "Users view own uploads" ON uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage uploads" ON uploads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Comments: Public read, authenticated users can create, users can update/delete own comments
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for buckets
-- Animation bucket
CREATE POLICY "Public read animation" ON storage.objects FOR SELECT USING (bucket_id = 'animation');
CREATE POLICY "Admin upload animation" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'animation' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin delete animation" ON storage.objects FOR DELETE USING (
  bucket_id = 'animation' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Artwork bucket
CREATE POLICY "Public read artwork" ON storage.objects FOR SELECT USING (bucket_id = 'artwork');
CREATE POLICY "Admin upload artwork" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'artwork' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin delete artwork" ON storage.objects FOR DELETE USING (
  bucket_id = 'artwork' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Video editing bucket
CREATE POLICY "Public read video_editing" ON storage.objects FOR SELECT USING (bucket_id = 'video_editing');
CREATE POLICY "Admin upload video_editing" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'video_editing' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin delete video_editing" ON storage.objects FOR DELETE USING (
  bucket_id = 'video_editing' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Order files bucket (for user uploaded reference files)
CREATE POLICY "Users upload own order files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'order-files' AND
  (storage.foldername(name))[1] IN (
    SELECT order_id FROM orders WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users view own order files" ON storage.objects FOR SELECT USING (
  bucket_id = 'order-files' AND
  (storage.foldername(name))[1] IN (
    SELECT order_id FROM orders WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Admin manage all order files" ON storage.objects FOR ALL USING (
  bucket_id = 'order-files' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Insert sample products
INSERT INTO products (name, price, description, category) VALUES
('Custom Animation', 100.00, 'Professional animation service', 'animation'),
('Digital Artwork', 50.00, 'Custom digital art piece', 'artwork'),
('Video Editing Package', 150.00, 'Complete video editing service', 'video_editing');

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create admin user (replace with actual UUID)
-- INSERT INTO profiles (id, full_name, is_admin) VALUES ('your-admin-uuid', 'Admin User', true);

-- Cart System Tables

-- Coupons table for discounts
CREATE TABLE coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carts table: stores cart metadata
CREATE TABLE carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For guest users
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    coupon_id UUID REFERENCES coupons(id),
    total DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id), -- One cart per user
    UNIQUE(session_id) -- One cart per session
);

-- Cart items table: each row is an item inside a cart
CREATE TABLE cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('package', 'subscription', 'special_request')),
    item_id UUID NOT NULL, -- References products.id for packages/subscriptions, or generated for special requests
    title TEXT NOT NULL,
    description TEXT,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    options JSONB DEFAULT '{}', -- Additional options like duration, format, etc.
    reference_files TEXT[] DEFAULT '{}', -- Array of Supabase storage URLs
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for Cart System

-- Coupons: Public read for validation, admin manage
CREATE POLICY "Public read active coupons" ON coupons FOR SELECT USING (is_active = true AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW()));
CREATE POLICY "Admin manage coupons" ON coupons FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Carts: Users can manage their own carts, guests can manage by session
CREATE POLICY "Users manage own carts" ON carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Guests manage session carts" ON carts FOR ALL USING (session_id IS NOT NULL);

-- Cart items: Same as carts
CREATE POLICY "Users manage own cart items" ON cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
);
CREATE POLICY "Guests manage session cart items" ON cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_items.cart_id AND session_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_coupons_code ON coupons(code);