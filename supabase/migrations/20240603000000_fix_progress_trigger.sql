-- Fix the update_progress_on_meal_cooked function to use SECURITY DEFINER

-- Update the function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_progress_on_meal_cooked()
RETURNS TRIGGER AS $$
DECLARE
  meal_user_id uuid;
  meal_date date;
  meal_type text;
BEGIN
  -- Get the user_id and date for this meal
  SELECT mp.user_id, mp.start_date + NEW.day_index INTO meal_user_id, meal_date
  FROM meal_plans mp
  WHERE mp.id = NEW.meal_plan_id;
  
  -- Get the meal type
  meal_type := NEW.meal_type;
  
  -- Update the progress for this date
  IF NEW.is_cooked THEN
    INSERT INTO user_progress (
      user_id, 
      date, 
      meal_plan_id,
      breakfast_completed,
      lunch_completed,
      dinner_completed,
      snack_completed
    )
    VALUES (
      meal_user_id,
      meal_date,
      NEW.meal_plan_id,
      CASE WHEN meal_type = 'breakfast' THEN true ELSE false END,
      CASE WHEN meal_type = 'lunch' THEN true ELSE false END,
      CASE WHEN meal_type = 'dinner' THEN true ELSE false END,
      CASE WHEN meal_type = 'snack' THEN true ELSE false END
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      breakfast_completed = user_progress.breakfast_completed OR EXCLUDED.breakfast_completed,
      lunch_completed = user_progress.lunch_completed OR EXCLUDED.lunch_completed,
      dinner_completed = user_progress.dinner_completed OR EXCLUDED.dinner_completed,
      snack_completed = user_progress.snack_completed OR EXCLUDED.snack_completed,
      updated_at = now();
  END IF;
  
  -- Check and update achievements
  PERFORM check_and_update_achievements(meal_user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the update_daily_progress function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_daily_progress(user_id_param uuid)
RETURNS void AS $$
DECLARE
  today_date date := CURRENT_DATE;
  current_meal_plan_id uuid;
BEGIN
  -- Get current meal plan
  SELECT id INTO current_meal_plan_id
  FROM meal_plans
  WHERE user_id = user_id_param
    AND is_current = true
    AND status = 'active'
  LIMIT 1;
  
  -- Create or update progress record for today
  INSERT INTO user_progress (user_id, date, meal_plan_id)
  VALUES (user_id_param, today_date, current_meal_plan_id)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    meal_plan_id = EXCLUDED.meal_plan_id,
    updated_at = now();
    
  -- Check and update achievements
  PERFORM check_and_update_achievements(user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
