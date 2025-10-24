-- Add PENDING state to video_status enum
-- This adds PENDING as the first state in the enum, making it the new default

-- First, add PENDING to the enum
ALTER TYPE video_status ADD VALUE 'PENDING' BEFORE 'QUEUED';
-- Update the default value for the status column to use PENDING
ALTER TABLE public.videos ALTER COLUMN status SET DEFAULT 'PENDING';

-- Update any existing videos that are currently QUEUED to PENDING
-- (This is optional - you might want to keep existing QUEUED videos as-is)
-- UPDATE public.videos SET status = 'PENDING' WHERE status = 'QUEUED';

