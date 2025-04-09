-- Create a function to automatically determine the current meal plan based on dates
CREATE OR REPLACE FUNCTION update_current_meal_plan_status()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  next_meal_plan_id UUID;
BEGIN
  -- If a meal plan is explicitly set as current, we respect that choice
  -- This trigger only runs when no meal plan is explicitly set as current
  
  -- Find the meal plan that covers today's date
  SELECT id INTO next_meal_plan_id
  FROM meal_plans
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND start_date <= today_date
    AND end_date >= today_date
  ORDER BY start_date DESC
  LIMIT 1;
  
  -- If no meal plan covers today, find the next upcoming meal plan
  IF next_meal_plan_id IS NULL THEN
    SELECT id INTO next_meal_plan_id
    FROM meal_plans
    WHERE user_id = NEW.user_id
      AND status = 'active'
      AND start_date > today_date
    ORDER BY start_date ASC
    LIMIT 1;
  END IF;
  
  -- If we found a meal plan, set it as current
  IF next_meal_plan_id IS NOT NULL THEN
    UPDATE meal_plans
    SET is_current = TRUE
    WHERE id = next_meal_plan_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function to run daily and update meal plan statuses
CREATE OR REPLACE FUNCTION daily_update_meal_plan_status()
RETURNS void AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  user_record RECORD;
BEGIN
  -- For each user with meal plans
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM meal_plans
    WHERE status = 'active'
  LOOP
    -- Find if there's a meal plan that should be current based on date
    WITH current_plan AS (
      SELECT id
      FROM meal_plans
      WHERE user_id = user_record.user_id
        AND status = 'active'
        AND start_date <= today_date
        AND end_date >= today_date
      ORDER BY start_date DESC
      LIMIT 1
    ),
    next_plan AS (
      SELECT id
      FROM meal_plans
      WHERE user_id = user_record.user_id
        AND status = 'active'
        AND start_date > today_date
      ORDER BY start_date ASC
      LIMIT 1
      -- Only select if no current plan exists
      WHERE NOT EXISTS (SELECT 1 FROM current_plan)
    ),
    target_plan AS (
      SELECT id FROM current_plan
      UNION
      SELECT id FROM next_plan
    )
    -- Update all meal plans for this user
    UPDATE meal_plans
    SET is_current = (id IN (SELECT id FROM target_plan))
    WHERE user_id = user_record.user_id
      AND status = 'active';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the daily update function
-- Note: This requires the pg_cron extension to be enabled
-- If pg_cron is not available, you'll need to implement this via an external scheduler
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'update-meal-plan-status',
      '0 0 * * *',  -- Run at midnight every day
      $$SELECT daily_update_meal_plan_status()$$
    );
  END IF;
END $$;
