-- Fix RLS policies for user_achievements and user_rewards

-- Add INSERT policy for user_achievements if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_achievements' 
        AND operation = 'INSERT'
    ) THEN
        CREATE POLICY "Users can insert own achievements"
        ON user_achievements
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Add INSERT policy for user_rewards if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_rewards' 
        AND operation = 'INSERT'
    ) THEN
        CREATE POLICY "Users can insert own rewards"
        ON user_rewards
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Fix the check_and_update_achievements function to handle RLS
CREATE OR REPLACE FUNCTION check_and_update_achievements(user_id_param uuid)
RETURNS void AS $$
DECLARE
  achievement_record RECORD;
  user_data RECORD;
  achievement_progress jsonb;
  is_completed boolean;
BEGIN
  -- Get all achievement types
  FOR achievement_record IN SELECT * FROM achievement_types
  LOOP
    -- Get or create user achievement record
    SELECT * INTO user_data FROM user_achievements 
    WHERE user_id = user_id_param AND achievement_type_id = achievement_record.id;
    
    IF NOT FOUND THEN
      -- Create new achievement record for user with security definer
      INSERT INTO user_achievements (user_id, achievement_type_id, progress, completed)
      VALUES (user_id_param, achievement_record.id, '{}'::jsonb, false)
      RETURNING * INTO user_data;
    END IF;
    
    -- Skip if already completed
    IF user_data.completed THEN
      CONTINUE;
    END IF;
    
    -- Calculate current progress based on achievement type
    achievement_progress := user_data.progress;
    is_completed := false;
    
    -- Check meal plans created
    IF achievement_record.requirements ? 'meal_plans_created' THEN
      DECLARE
        meal_plans_count int;
        required_count int := (achievement_record.requirements->>'meal_plans_created')::int;
      BEGIN
        SELECT COUNT(*) INTO meal_plans_count FROM meal_plans WHERE user_id = user_id_param;
        achievement_progress := jsonb_set(achievement_progress, '{meal_plans_created}', to_jsonb(meal_plans_count));
        is_completed := meal_plans_count >= required_count;
      END;
    END IF;
    
    -- Check recipes cooked
    IF achievement_record.requirements ? 'recipes_cooked' THEN
      DECLARE
        recipes_count int;
        required_count int := (achievement_record.requirements->>'recipes_cooked')::int;
      BEGIN
        SELECT COUNT(*) INTO recipes_count FROM meal_plan_recipes mpr
        JOIN meal_plans mp ON mpr.meal_plan_id = mp.id
        WHERE mp.user_id = user_id_param AND mpr.is_cooked = true;
        achievement_progress := jsonb_set(achievement_progress, '{recipes_cooked}', to_jsonb(recipes_count));
        is_completed := recipes_count >= required_count;
      END;
    END IF;
    
    -- Check consecutive days
    IF achievement_record.requirements ? 'consecutive_days' THEN
      DECLARE
        max_streak int := 0;
        current_streak int := 0;
        prev_date date := NULL;
        required_streak int := (achievement_record.requirements->>'consecutive_days')::int;
        progress_record RECORD;
      BEGIN
        FOR progress_record IN 
          SELECT date, 
                 (breakfast_completed OR lunch_completed OR dinner_completed) as any_completed
          FROM user_progress
          WHERE user_id = user_id_param
          ORDER BY date
        LOOP
          IF progress_record.any_completed THEN
            IF prev_date IS NULL OR progress_record.date = prev_date + 1 THEN
              current_streak := current_streak + 1;
            ELSE
              current_streak := 1;
            END IF;
            
            IF current_streak > max_streak THEN
              max_streak := current_streak;
            END IF;
          ELSE
            current_streak := 0;
          END IF;
          
          prev_date := progress_record.date;
        END LOOP;
        
        achievement_progress := jsonb_set(achievement_progress, '{consecutive_days}', to_jsonb(max_streak));
        is_completed := max_streak >= required_streak;
      END;
    END IF;
    
    -- Check shopping lists completed
    IF achievement_record.requirements ? 'shopping_lists_completed' THEN
      DECLARE
        shopping_count int;
        required_count int := (achievement_record.requirements->>'shopping_lists_completed')::int;
      BEGIN
        SELECT COUNT(DISTINCT date) INTO shopping_count 
        FROM user_progress
        WHERE user_id = user_id_param AND shopping_completed = true;
        achievement_progress := jsonb_set(achievement_progress, '{shopping_lists_completed}', to_jsonb(shopping_count));
        is_completed := shopping_count >= required_count;
      END;
    END IF;
    
    -- Update the achievement record
    UPDATE user_achievements
    SET 
      progress = achievement_progress,
      completed = is_completed,
      achieved_at = CASE WHEN is_completed AND NOT user_data.completed THEN now() ELSE user_data.achieved_at END
    WHERE id = user_data.id;
    
    -- If newly completed, add points to user
    IF is_completed AND NOT user_data.completed THEN
      -- Logic to award points would go here
      -- For now, we'll just create a reward if enough points
      IF achievement_record.points >= 50 THEN
        -- Use a direct insert with the user_id to avoid RLS issues
        INSERT INTO user_rewards (user_id, reward_type_id)
        SELECT user_id_param, id FROM reward_types
        WHERE points_required <= achievement_record.points
        ORDER BY RANDOM()
        LIMIT 1;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
