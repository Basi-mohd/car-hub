-- Migration script to convert from OTP to password authentication
-- Run this SQL in your Supabase SQL Editor

-- Add password column to existing admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'admin@Carhub';

-- Update existing admin records to have the default password
UPDATE admins SET password = 'admin@Carhub' WHERE password IS NULL;

-- Make password column NOT NULL after setting default values
ALTER TABLE admins ALTER COLUMN password SET NOT NULL;

-- Remove OTP-related columns (optional - you can keep them if needed)
-- ALTER TABLE admins DROP COLUMN IF EXISTS otp;
-- ALTER TABLE admins DROP COLUMN IF EXISTS otp_expires_at;

-- Verify the migration
SELECT id, phone, name, role, is_active, password, created_at 
FROM admins 
ORDER BY created_at DESC;
