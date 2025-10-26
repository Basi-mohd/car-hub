-- SQL Updates for Customer Management Enhancement
-- Add description and enquiry fields to customers table

-- Add new columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_enquiry BOOLEAN DEFAULT false;

-- Add index for enquiry filtering
CREATE INDEX IF NOT EXISTS idx_customers_is_enquiry ON customers(is_enquiry);

-- Update existing customers to have is_enquiry = false by default
UPDATE customers SET is_enquiry = false WHERE is_enquiry IS NULL;

-- Optional: Add a comment to document the new fields
COMMENT ON COLUMN customers.description IS 'Customer description or notes';
COMMENT ON COLUMN customers.is_enquiry IS 'Indicates if this customer is an enquiry (true) or actual customer (false)';
