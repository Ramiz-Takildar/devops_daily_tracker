-- Migration: Add profile fields to users table
-- This migration adds bio, avatar, and updated_at columns to the existing users table
-- Safe to run on existing database - will not affect existing data

-- Add bio column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'bio'
    ) THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to users table';
    ELSE
        RAISE NOTICE 'bio column already exists in users table';
    END IF;
END $$;

-- Add avatar column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar TEXT;
        RAISE NOTICE 'Added avatar column to users table';
    ELSE
        RAISE NOTICE 'avatar column already exists in users table';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to users table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in users table';
    END IF;
END $$;

-- Update existing rows to have updated_at = created_at if updated_at is NULL
UPDATE users 
SET updated_at = created_at 
WHERE updated_at IS NULL;

RAISE NOTICE 'Migration completed successfully';
