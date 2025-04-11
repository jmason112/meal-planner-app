/*
  # Progress Tracking and Rewards Schema

  1. New Tables
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `meal_plan_id` (uuid, references meal_plans)
      - `breakfast_completed` (boolean)
      - `lunch_completed` (boolean)
      - `dinner_completed` (boolean)
      - `snack_completed` (boolean)
      - `shopping_completed` (boolean)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `achievement_types`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `icon` (text)
      - `points` (int)
      - `requirements` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `achievement_type_id` (uuid, references achievement_types)
      - `achieved_at` (timestamptz)
      - `progress` (jsonb)
      - `completed` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `reward_types`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `icon` (text)
      - `points_required` (int)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_rewards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `reward_type_id` (uuid, references reward_types)
      - `earned_at` (timestamptz)
      - `redeemed` (boolean)
      - `redeemed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their progress and achievements
*/

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  meal_plan_id uuid REFERENCES meal_plans,
  breakfast_completed boolean DEFAULT false,
  lunch_completed boolean DEFAULT false,
  dinner_completed boolean DEFAULT false,
  snack_completed boolean DEFAULT false,
  shopping_completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create achievement_types table
CREATE TABLE IF NOT EXISTS achievement_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL,
  points int NOT NULL DEFAULT 0,
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  achievement_type_id uuid REFERENCES achievement_types NOT NULL,
  achieved_at timestamptz,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_type_id)
);

-- Create reward_types table
CREATE TABLE IF NOT EXISTS reward_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL,
  points_required int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  reward_type_id uuid REFERENCES reward_types NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  redeemed boolean DEFAULT false,
  redeemed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add is_cooked field to meal_plan_recipes table
ALTER TABLE meal_plan_recipes ADD COLUMN IF NOT EXISTS is_cooked boolean DEFAULT false;

-- Add progress_tracking field to user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS progress_tracking jsonb DEFAULT '{
  "enabled": true,
  "track_breakfast": true,
  "track_lunch": true,
  "track_dinner": true,
  "track_snack": false,
  "track_shopping": true,
  "notifications_enabled": true,
  "daily_goal_notifications": true,
  "achievement_notifications": true
}'::jsonb;

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for achievement_types
CREATE POLICY "Anyone can view achievement types"
  ON achievement_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON user_achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for reward_types
CREATE POLICY "Anyone can view reward types"
  ON reward_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for user_rewards
CREATE POLICY "Users can view own rewards"
  ON user_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON user_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON user_rewards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievement_types_updated_at
  BEFORE UPDATE ON achievement_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_types_updated_at
  BEFORE UPDATE ON reward_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_rewards_updated_at
  BEFORE UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default achievement types
INSERT INTO achievement_types (name, description, category, icon, points, requirements) VALUES
('First Meal Plan', 'Create your first meal plan', 'planning', 'Calendar', 10, '{"meal_plans_created": 1}'::jsonb),
('Meal Planning Pro', 'Create 5 meal plans', 'planning', 'Calendar', 25, '{"meal_plans_created": 5}'::jsonb),
('Master Planner', 'Create 20 meal plans', 'planning', 'Calendar', 50, '{"meal_plans_created": 20}'::jsonb),
('First Recipe', 'Cook your first recipe', 'cooking', 'Utensils', 10, '{"recipes_cooked": 1}'::jsonb),
('Home Chef', 'Cook 10 recipes', 'cooking', 'ChefHat', 25, '{"recipes_cooked": 10}'::jsonb),
('Master Chef', 'Cook 50 recipes', 'cooking', 'Award', 100, '{"recipes_cooked": 50}'::jsonb),
('Perfect Week', 'Complete all planned meals for a week', 'streak', 'Star', 30, '{"consecutive_days": 7}'::jsonb),
('Perfect Month', 'Complete all planned meals for a month', 'streak', 'Trophy', 100, '{"consecutive_days": 30}'::jsonb),
('Shopping Master', 'Complete 10 shopping lists', 'shopping', 'ShoppingBag', 25, '{"shopping_lists_completed": 10}'::jsonb),
('Healthy Choices', 'Add 10 healthy recipes to your meal plans', 'nutrition', 'Heart', 25, '{"healthy_recipes": 10}'::jsonb),
('Variety King', 'Cook recipes from 5 different cuisines', 'diversity', 'Globe', 25, '{"cuisine_types": 5}'::jsonb);

-- Insert default reward types
INSERT INTO reward_types (name, description, category, icon, points_required) VALUES
('Recipe Unlock', 'Unlock a premium recipe', 'recipe', 'Unlock', 50),
('Meal Plan Template', 'Unlock a premium meal plan template', 'planning', 'Template', 100),
('Custom Badge', 'Earn a custom profile badge', 'profile', 'Badge', 75),
('Theme Unlock', 'Unlock a custom app theme', 'customization', 'Palette', 150),
('Cooking Timer', 'Unlock a special cooking timer', 'tool', 'Clock', 125);

-- Create function to check and update achievements
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
      -- Create new achievement record for user
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
        INSERT INTO user_rewards (user_id, reward_type_id)
        SELECT user_id_param, id FROM reward_types
        WHERE points_required <= achievement_record.points
        ORDER BY RANDOM()
        LIMIT 1;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to update daily progress
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
$$ LANGUAGE plpgsql;

-- Create trigger to update progress when a meal is marked as cooked
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_progress_on_meal_cooked_trigger
AFTER UPDATE OF is_cooked ON meal_plan_recipes
FOR EACH ROW
WHEN (OLD.is_cooked IS DISTINCT FROM NEW.is_cooked)
EXECUTE FUNCTION update_progress_on_meal_cooked();
