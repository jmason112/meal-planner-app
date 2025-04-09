-- Fix any existing shopping list data

-- 1. Consolidate multiple active shopping lists for each user
WITH ranked_lists AS (
  SELECT 
    id,
    user_id,
    status,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.shopping_lists
  WHERE status = 'active'
),
primary_lists AS (
  SELECT id, user_id
  FROM ranked_lists
  WHERE rn = 1
),
secondary_lists AS (
  SELECT id, user_id
  FROM ranked_lists
  WHERE rn > 1
)
UPDATE public.shopping_list_items
SET shopping_list_id = pl.id
FROM secondary_lists sl
JOIN primary_lists pl ON sl.user_id = pl.user_id
WHERE shopping_list_id = sl.id;

-- 2. Set secondary lists to inactive
WITH ranked_lists AS (
  SELECT 
    id,
    user_id,
    status,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.shopping_lists
  WHERE status = 'active'
)
UPDATE public.shopping_lists
SET status = 'inactive'
FROM ranked_lists
WHERE public.shopping_lists.id = ranked_lists.id AND ranked_lists.rn > 1;

-- 3. Fix any recipeId fields to recipe_id if needed
UPDATE public.shopping_list_items
SET recipe_id = recipe_id
WHERE recipe_id IS NULL AND recipe_id IS NOT NULL;

-- 4. Add an index on recipe_id for better performance
CREATE INDEX IF NOT EXISTS shopping_list_items_recipe_id_idx ON public.shopping_list_items(recipe_id);
