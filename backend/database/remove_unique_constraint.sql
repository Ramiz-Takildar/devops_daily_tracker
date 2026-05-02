-- Migration: Remove UNIQUE constraint to allow multiple entries per tool per day
-- This allows users to log multiple learning sessions for the same tool on the same day

-- Drop the unique constraint
ALTER TABLE daily_entries DROP CONSTRAINT IF EXISTS daily_entries_user_id_tool_id_date_key;

-- Add a comment to document the change
COMMENT ON TABLE daily_entries IS 'Allows multiple entries per user, tool, and date to support multiple learning sessions per day';

-- Verify the constraint is removed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'daily_entries_user_id_tool_id_date_key'
    ) THEN
        RAISE NOTICE '✅ Successfully removed UNIQUE constraint on (user_id, tool_id, date)';
        RAISE NOTICE '✅ Users can now add multiple entries for the same tool on the same day';
    ELSE
        RAISE WARNING '⚠️  Constraint still exists - manual intervention may be required';
    END IF;
END $$;
