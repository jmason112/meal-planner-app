import { supabase } from './supabase';

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  status: 'active' | 'archived';
  is_favorite: boolean;
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  recipes?: MealPlanRecipe[];
}

export interface MealPlanRecipe {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  recipe_data: any;
  day_index: number;
  meal_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveMealPlanParams {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  start_date: string;
  end_date: string;
  is_current?: boolean;
  replace_current?: boolean;
  recipes: {
    recipe_id: string;
    recipe_data: any;
    day_index: number;
    meal_type: string;
    notes?: string;
  }[];
}

export async function saveMealPlan(params: SaveMealPlanParams): Promise<MealPlan> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Handle current meal plan logic
  let is_current = false;

  // If this plan should replace the current one or be set as current
  if (params.replace_current || params.is_current) {
    is_current = true;
  }
  // Otherwise, check if there's no current plan yet
  else {
    const { data: currentPlans, error: currentPlansError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .limit(1);

    if (currentPlansError) {
      console.error('Error checking current meal plans:', currentPlansError);
    } else if (!currentPlans || currentPlans.length === 0) {
      // If no current plan exists, make this one current
      is_current = true;
    }
  }

  // Start a transaction
  const { data: mealPlan, error: mealPlanError } = await supabase
    .from('meal_plans')
    .insert({
      user_id: user.id,
      name: params.name,
      description: params.description,
      category: params.category,
      tags: params.tags || [],
      start_date: params.start_date,
      end_date: params.end_date,
      is_current: is_current
    })
    .select()
    .single();

  if (mealPlanError) {
    throw new Error(`Error creating meal plan: ${mealPlanError.message}`);
  }

  // Insert recipes
  const { error: recipesError } = await supabase
    .from('meal_plan_recipes')
    .insert(
      params.recipes.map(recipe => ({
        meal_plan_id: mealPlan.id,
        ...recipe
      }))
    );

  if (recipesError) {
    // If recipes insertion fails, the meal plan will be automatically rolled back
    throw new Error(`Error adding recipes to meal plan: ${recipesError.message}`);
  }

  return mealPlan;
}

export async function getMealPlans(options: {
  status?: 'active' | 'archived';
  category?: string;
  is_favorite?: boolean;
  is_current?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'start_date';
  sort_direction?: 'asc' | 'desc';
} = {}): Promise<MealPlan[]> {
  let query = supabase
    .from('meal_plans')
    .select(`
      *,
      recipes:meal_plan_recipes(*)
    `);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.is_favorite !== undefined) {
    query = query.eq('is_favorite', options.is_favorite);
  }

  if (options.is_current !== undefined) {
    query = query.eq('is_current', options.is_current);
  }

  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  // Default sort by created_at descending if not specified
  const sortBy = options.sort_by || 'created_at';
  const sortDirection = options.sort_direction || 'desc';
  const { data, error } = await query.order(sortBy, { ascending: sortDirection === 'asc' });

  if (error) {
    throw new Error(`Error fetching meal plans: ${error.message}`);
  }

  return data || [];
}

export async function updateMealPlan(
  id: string,
  updates: Partial<Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<MealPlan> {
  const { data, error } = await supabase
    .from('meal_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating meal plan: ${error.message}`);
  }

  return data;
}

export async function deleteMealPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting meal plan: ${error.message}`);
  }
}

export async function toggleFavorite(id: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_meal_plan_favorite', {
    meal_plan_id: id
  });

  if (error) {
    throw new Error(`Error toggling favorite status: ${error.message}`);
  }
}

export async function setCurrentMealPlan(id: string): Promise<MealPlan> {
  // Set this meal plan as current
  const { data: updatedMealPlan, error: updateError } = await supabase
    .from('meal_plans')
    .update({ is_current: true })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Error setting current meal plan: ${updateError.message}`);
  }

  return updatedMealPlan;
}

export async function getCurrentMealPlan(): Promise<MealPlan | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Get the current meal plan
  const { data, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipes:meal_plan_recipes(*)
    `)
    .eq('user_id', user.id)
    .eq('is_current', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
    throw new Error(`Error fetching current meal plan: ${error.message}`);
  }

  return data || null;
}

export async function updateMealPlanRecipes(
  mealPlanId: string,
  recipes: {
    id?: string;
    recipe_id: string;
    recipe_data: any;
    day_index: number;
    meal_type: string;
    notes?: string;
  }[],
  replaceAll: boolean = true
): Promise<void> {
  if (replaceAll) {
    // Delete all existing recipes if we're replacing everything
    const { error: deleteError } = await supabase
      .from('meal_plan_recipes')
      .delete()
      .eq('meal_plan_id', mealPlanId);

    if (deleteError) {
      throw new Error(`Error updating meal plan recipes: ${deleteError.message}`);
    }

    // Then insert the new recipes
    const { error: insertError } = await supabase
      .from('meal_plan_recipes')
      .insert(
        recipes.map(recipe => ({
          meal_plan_id: mealPlanId,
          ...recipe
        }))
      );

    if (insertError) {
      throw new Error(`Error updating meal plan recipes: ${insertError.message}`);
    }
  } else {
    // Just add the new recipes without deleting existing ones
    // Filter out any recipes that might have an id to avoid conflicts
    const newRecipes = recipes.filter(recipe => !recipe.id);

    if (newRecipes.length === 0) return;

    const { error: insertError } = await supabase
      .from('meal_plan_recipes')
      .insert(
        newRecipes.map(recipe => ({
          meal_plan_id: mealPlanId,
          ...recipe
        }))
      );

    if (insertError) {
      throw new Error(`Error adding recipes to meal plan: ${insertError.message}`);
    }
  }
}

export function exportMealPlan(mealPlan: MealPlan): string {
  const exportData = {
    ...mealPlan,
    exported_at: new Date().toISOString(),
    version: '1.0'
  };

  return JSON.stringify(exportData, null, 2);
}

export function generateShareableLink(mealPlanId: string): string {
  return `${window.location.origin}/meal-plan/${mealPlanId}`;
}