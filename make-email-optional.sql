-- Migration: Make email optional in customers table
-- This script makes the email column nullable in the customers table

-- Alter the customers table to make email nullable
ALTER TABLE customers 
ALTER COLUMN email DROP NOT NULL;

-- Note: Existing customers with email will remain unchanged
-- New customers can be created without an email address

