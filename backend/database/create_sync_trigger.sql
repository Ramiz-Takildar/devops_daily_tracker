-- Create function to automatically sync tool_proficiency with daily_entries
CREATE OR REPLACE FUNCTION sync_tool_proficiency()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tool_proficiency with actual sum from daily_entries
    UPDATE tool_proficiency tp
    SET 
        total_hours = (
            SELECT COALESCE(SUM(de.hours_spent), 0)
            FROM daily_entries de
            WHERE de.user_id = tp.user_id AND de.tool_id = tp.tool_id
        ),
        last_practiced = (
            SELECT MAX(de.date)
            FROM daily_entries de
            WHERE de.user_id = tp.user_id AND de.tool_id = tp.tool_id
        ),
        practice_days = (
            SELECT COUNT(DISTINCT de.date)
            FROM daily_entries de
            WHERE de.user_id = tp.user_id AND de.tool_id = tp.tool_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE tp.user_id = COALESCE(NEW.user_id, OLD.user_id) 
      AND tp.tool_id = COALESCE(NEW.tool_id, OLD.tool_id);
    
    -- Create proficiency record if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO tool_proficiency (user_id, tool_id, total_hours, last_practiced, practice_days)
        SELECT 
            COALESCE(NEW.user_id, OLD.user_id),
            COALESCE(NEW.tool_id, OLD.tool_id),
            COALESCE(SUM(de.hours_spent), 0),
            MAX(de.date),
            COUNT(DISTINCT de.date)
        FROM daily_entries de
        WHERE de.user_id = COALESCE(NEW.user_id, OLD.user_id)
          AND de.tool_id = COALESCE(NEW.tool_id, OLD.tool_id)
        ON CONFLICT (user_id, tool_id) DO NOTHING;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_tool_proficiency_trigger ON daily_entries;

-- Create trigger on INSERT, UPDATE, DELETE
CREATE TRIGGER sync_tool_proficiency_trigger
AFTER INSERT OR UPDATE OR DELETE ON daily_entries
FOR EACH ROW
EXECUTE FUNCTION sync_tool_proficiency();

-- Sync all existing records immediately
UPDATE tool_proficiency tp
SET total_hours = (
    SELECT COALESCE(SUM(de.hours_spent), 0)
    FROM daily_entries de
    WHERE de.user_id = tp.user_id AND de.tool_id = tp.tool_id
);
