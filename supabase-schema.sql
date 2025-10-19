-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    plate TEXT NOT NULL,
    year INTEGER,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number INTEGER UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    vehicle_info TEXT NOT NULL,
    service_type TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'in-progress', 'completed', 'paid')),
    price NUMERIC NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'credit-card', 'mobile-payment'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your authentication needs)
CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON customers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON vehicles FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON vehicles FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON bookings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON bookings FOR DELETE USING (true);

-- Sequence and trigger for booking_number starting at 1001
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bookings_booking_number_seq') THEN
    CREATE SEQUENCE bookings_booking_number_seq START 1001;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := nextval('bookings_booking_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_booking_number ON bookings;
CREATE TRIGGER tr_set_booking_number
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_number();

-- Create admin table for phone OTP authentication (demo)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    is_active BOOLEAN DEFAULT true,
    otp TEXT DEFAULT '123456',
    otp_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for phone lookup
CREATE INDEX IF NOT EXISTS idx_admins_phone ON admins(phone);

-- Enable RLS for admin table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admin table (restrictive access for demo)
CREATE POLICY "Enable read access for all users" ON admins FOR SELECT USING (true);
CREATE POLICY "Enable insert access for service role only" ON admins FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable update access for service role only" ON admins FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Enable delete access for service role only" ON admins FOR DELETE USING (auth.role() = 'service_role');

-- Insert sample admins for demo
INSERT INTO admins (phone, name, role)
VALUES 
  ('+1234567890', 'Demo Admin', 'admin'),
  ('+1987654321', 'Super Admin', 'superadmin')
ON CONFLICT (phone) DO NOTHING;


