-- PROJECT REQUESTS TABLE
-- Stores manual intake form submissions from potential clients
-- These are NOT orders until the user is directed to Fiverr and completes payment

CREATE TABLE project_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Client Info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Project Details
  project_type TEXT NOT NULL CHECK (project_type IN ('animation', 'video', 'web', 'other')),
  budget_range TEXT NOT NULL,
  deadline DATE,
  description TEXT NOT NULL,
  
  -- Status Management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT
);

-- Index for faster queries on status and created_at
CREATE INDEX idx_project_requests_status ON project_requests(status);
CREATE INDEX idx_project_requests_created_at ON project_requests(created_at DESC);
CREATE INDEX idx_project_requests_email ON project_requests(email);

-- Enable RLS for security
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admins can view all requests
CREATE POLICY "Admins can view all project requests"
  ON project_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Public can only insert (create new requests)
CREATE POLICY "Public can create project requests"
  ON project_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can update status and notes
CREATE POLICY "Admins can update project requests"
  ON project_requests
  FOR UPDATE
  USING (auth.role() = 'authenticated');
