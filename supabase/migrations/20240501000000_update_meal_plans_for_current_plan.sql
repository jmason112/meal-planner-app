-- Add is_current field to meal_plans table
ALTER TABLE meal_plans ADD COLUMN is_current BOOLEAN DEFAULT false;

-- Create a function to ensure only one meal plan is current per user
CREATE OR REPLACE FUNCTION ensure_single_current_meal_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated meal plan is being set as current
  IF NEW.is_current = true THEN
    -- Set all other meal plans for this user to not current
    UPDATE meal_plans
    SET is_current = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the function before insert or update
CREATE TRIGGER ensure_single_current_meal_plan_trigger
BEFORE INSERT OR UPDATE ON meal_plans
FOR EACH ROW
EXECUTE FUNCTION ensure_single_current_meal_plan();

-- Add index for faster queries on current meal plans
CREATE INDEX idx_meal_plans_is_current ON meal_plans(user_id, is_current);

-- Add a constraint to ensure start_date is not null
ALTER TABLE meal_plans ALTER COLUMN start_date SET NOT NULL;

-- Add a constraint to ensure end_date is not null
ALTER TABLE meal_plans ALTER COLUMN end_date SET NOT NULL;

-- Add a constraint to ensure end_date is after start_date
ALTER TABLE meal_plans ADD CONSTRAINT end_date_after_start_date 
CHECK (end_date >= start_date);

-- Add a constraint to ensure meal plans don't extend beyond a month
ALTER TABLE meal_plans ADD CONSTRAINT meal_plan_max_duration 
CHECK (end_date <= start_date + INTERVAL '31 days');
