-- Setup demo admin users for Care Hub
-- Run this SQL in your Supabase SQL Editor
-- IMPORTANT: Run migrate-to-password-auth.sql first to add the password column

-- Clear existing demo data
DELETE FROM admins WHERE phone IN ('+1234567890', '+1987654321');

-- Insert demo admin users
INSERT INTO admins (phone, name, role, is_active, password)
VALUES 
  ('+1234567890', 'Demo Admin', 'admin', true, 'admin@Carhub'),
  ('+1987654321', 'Super Admin', 'superadmin', true, 'admin@Carhub');

-- Verify the data was inserted
SELECT id, phone, name, role, is_active, password, created_at 
FROM admins 
ORDER BY created_at DESC;
