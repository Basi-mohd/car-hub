-- Run this SQL in your Supabase SQL Editor to create the demo admin user
-- This will create a user in Supabase Auth and automatically create the admin profile

-- First, create the user in auth.users (you'll need to do this through Supabase Dashboard or API)
-- For now, you can create the user manually in the Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Email: +1234567890
-- 4. Password: admin123
-- 5. Confirm password: admin123
-- 6. Click "Create user"

-- The trigger will automatically create the admin profile when the user is created
-- But if you need to manually insert the profile, use this (replace USER_ID with actual user ID):

-- INSERT INTO admin_profiles (id, phone, name, role)
-- VALUES (
--   'USER_ID_FROM_AUTH_USERS', 
--   '+1234567890', 
--   'Demo Admin', 
--   'admin'
-- );

-- To get the user ID, run this query after creating the user:
-- SELECT id FROM auth.users WHERE email = '+1234567890';
