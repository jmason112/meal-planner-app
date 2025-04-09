/*
  # Meal Plans Schema

  1. New Tables
    - `meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `tags` (text[])
      - `status` (text)
      - `is_favorite` (boolean)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `meal_plan_recipes`
      - `id` (uuid, primary key)
      - `meal_plan_id` (uuid, references meal_plans)
      - `recipe_id` (text)
      - `recipe_data` (jsonb)
      - `day_index` (int)
      - `meal_type` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their meal plans
*/

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  is_favorite boolean DEFAULT false,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal_plan_recipes table
CREATE TABLE IF NOT EXISTS meal_plan_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans ON DELETE CASCADE NOT NULL,
  recipe_id text NOT NULL,
  recipe_data jsonb NOT NULL,
  day_index int NOT NULL,
  meal_type text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_plans
CREATE POLICY "Users can view own meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for meal_plan_recipes
CREATE POLICY "Users can view own meal plan recipes"
  ON meal_plan_recipes
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own meal plan recipes"
  ON meal_plan_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own meal plan recipes"
  ON meal_plan_recipes
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own meal plan recipes"
  ON meal_plan_recipes
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

-- Create updated_at triggers
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_recipes_updated_at
  BEFORE UPDATE ON meal_plan_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();