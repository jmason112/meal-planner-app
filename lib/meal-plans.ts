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
  is_cooked: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveMealPlanParams {
  id?: string; // Included for editing existing meal plans
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  recipes: {
    recipe_id: string;
    recipe_data: any;
    day_index: number;
    meal_type: string;
    notes?: string;
  }[];
}

export interface CreateMealPlanFromRecipeParams {
  name: string;
  description?: string;
  category?: string;
  recipeId: string;
  recipeData: any;
  mealType: string;
  numDays: number;
  dayIndices?: number[]; // Optional array of day indices to add the recipe to
}

export async function saveMealPlan(params: SaveMealPlanParams): Promise<MealPlan> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Automatically determine start and end dates
  let startDate: string;
  let endDate: string;

  // Get the latest meal plan to determine the next start date
  const { data: latestPlans, error: latestError } = await supabase
    .from('meal_plans')
    .select('end_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('end_date', { ascending: false })
    .limit(1);

  if (latestError) {
    throw new Error(`Error finding latest meal plan: ${latestError.message}`);
  }

  // If there's a previous plan, start the day after it ends
  if (latestPlans && latestPlans.length > 0 && latestPlans[0].end_date) {
    const lastEndDate = new Date(latestPlans[0].end_date);
    const newStartDate = new Date(lastEndDate);
    newStartDate.setDate(lastEndDate.getDate() + 1); // Start the day after the last plan ends
    startDate = newStartDate.toISOString().split('T')[0];
  } else {
    // If no previous plans, start today
    startDate = new Date().toISOString().split('T')[0];
  }

  // Calculate the number of days in the meal plan based on unique day_index values
  const uniqueDayIndices = new Set(params.recipes.map(recipe => recipe.day_index));
  const uniqueDaysArray = Array.from(uniqueDayIndices).sort((a, b) => a - b);
  const numDays = uniqueDayIndices.size;

  // Ensure we have at least one day in the meal plan
  if (numDays === 0) {
    throw new Error('Meal plan must contain at least one day of meals');
  }

  // Find the maximum day index to determine the actual span
  const maxDayIndex = Math.max(...uniqueDaysArray);

  // The span is from day 0 to maxDayIndex, inclusive
  // So if we have days [0, 1, 2], the span is 3 days (0 to 2, inclusive)
  const daysToAdd = maxDayIndex;

  // Set end date based on the number of days in the meal plan
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(startDateObj.getDate() + daysToAdd);
  endDate = endDateObj.toISOString().split('T')[0];

  console.log(`Creating meal plan with ${numDays} unique days (indices: ${uniqueDaysArray.join(', ')})`);
  console.log(`Date range: ${startDate} to ${endDate} (${daysToAdd + 1} days total)`);

  // Determine if this should be the current meal plan based on dates
  const today = new Date().toISOString().split('T')[0];
  let is_current = false;

  // If this plan includes today's date, make it current
  if (startDate <= today && endDate >= today) {
    is_current = true;
  }
  // If this plan is in the future and there's no current plan that includes today
  else if (startDate > today) {
    const { data: currentDatePlans, error: currentDateError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today)
      .limit(1);

    if (currentDateError) {
      console.error('Error checking current date plans:', currentDateError);
    } else if (!currentDatePlans || currentDatePlans.length === 0) {
      // If no plan covers today, make this the current plan if it's the next upcoming one
      const { data: earlierPlans, error: earlierError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .lt('start_date', startDate)
        .gt('start_date', today)
        .limit(1);

      if (earlierError) {
        console.error('Error checking earlier plans:', earlierError);
      } else if (!earlierPlans || earlierPlans.length === 0) {
        // If there are no plans starting between today and this plan's start date,
        // this is the next upcoming plan, so make it current
        is_current = true;
      }
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
      start_date: startDate,
      end_date: endDate,
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

  // First, try to get the meal plan marked as current
  const { data: currentMarkedPlan, error: currentError } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipes:meal_plan_recipes(*)
    `)
    .eq('user_id', user.id)
    .eq('is_current', true)
    .eq('status', 'active')
    .single();

  if (currentMarkedPlan) {
    return currentMarkedPlan;
  }

  if (currentError && currentError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
    throw new Error(`Error fetching current meal plan: ${currentError.message}`);
  }

  // If no plan is marked as current, find the plan that covers today's date
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  const { data: currentDatePlan, error: dateError } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipes:meal_plan_recipes(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  if (currentDatePlan) {
    // Automatically set this plan as current
    await setCurrentMealPlan(currentDatePlan.id);
    return currentDatePlan;
  }

  if (dateError && dateError.code !== 'PGRST116') {
    throw new Error(`Error fetching date-based meal plan: ${dateError.message}`);
  }

  // If no plan covers today, get the next upcoming meal plan
  const { data: upcomingPlan, error: upcomingError } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipes:meal_plan_recipes(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1)
    .single();

  if (upcomingPlan) {
    // Automatically set this plan as current
    await setCurrentMealPlan(upcomingPlan.id);
    return upcomingPlan;
  }

  if (upcomingError && upcomingError.code !== 'PGRST116') {
    throw new Error(`Error fetching upcoming meal plan: ${upcomingError.message}`);
  }

  // If no current or upcoming plans, return null
  return null;
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

export async function getWeekMealPlans(): Promise<MealPlan[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Get the start and end of the current week (Sunday to Saturday)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  // Format dates for query
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  // Get all meal plans that overlap with the current week
  const { data: weekPlans, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipes:meal_plan_recipes(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    .order('start_date', { ascending: true });

  if (error) {
    throw new Error(`Error fetching week meal plans: ${error.message}`);
  }

  return weekPlans || [];
}

export async function updateMealPlanStatusByDate(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Find the meal plan that covers today's date
  const { data: currentDatePlan, error: dateError } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  if (currentDatePlan) {
    // Set this plan as current
    await setCurrentMealPlan(currentDatePlan.id);
    return;
  }

  if (dateError && dateError.code !== 'PGRST116') {
    throw new Error(`Error finding current date meal plan: ${dateError.message}`);
  }

  // If no plan covers today, find the next upcoming meal plan
  const { data: upcomingPlan, error: upcomingError } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1)
    .single();

  if (upcomingPlan) {
    // Set this plan as current
    await setCurrentMealPlan(upcomingPlan.id);
    return;
  }

  if (upcomingError && upcomingError.code !== 'PGRST116') {
    throw new Error(`Error finding upcoming meal plan: ${upcomingError.message}`);
  }
}

// Mark a meal as cooked
export async function markMealAsCooked(mealPlanId: string, recipeId: string, dayIndex: number, mealType: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // First, verify that this meal plan belongs to the user
  const { data: mealPlan, error: mealPlanError } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('id', mealPlanId)
    .eq('user_id', user.id)
    .single();

  if (mealPlanError) {
    throw new Error(`Error verifying meal plan ownership: ${mealPlanError.message}`);
  }

  // Update the meal plan recipe
  const { error } = await supabase
    .from('meal_plan_recipes')
    .update({ is_cooked: true })
    .eq('meal_plan_id', mealPlanId)
    .eq('recipe_id', recipeId)
    .eq('day_index', dayIndex)
    .eq('meal_type', mealType);

  if (error) {
    throw new Error(`Error marking meal as cooked: ${error.message}`);
  }
}

// Mark a meal as not cooked
export async function markMealAsNotCooked(mealPlanId: string, recipeId: string, dayIndex: number, mealType: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // First, verify that this meal plan belongs to the user
  const { data: mealPlan, error: mealPlanError } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('id', mealPlanId)
    .eq('user_id', user.id)
    .single();

  if (mealPlanError) {
    throw new Error(`Error verifying meal plan ownership: ${mealPlanError.message}`);
  }

  // Update the meal plan recipe
  const { error } = await supabase
    .from('meal_plan_recipes')
    .update({ is_cooked: false })
    .eq('meal_plan_id', mealPlanId)
    .eq('recipe_id', recipeId)
    .eq('day_index', dayIndex)
    .eq('meal_type', mealType);

  if (error) {
    throw new Error(`Error marking meal as not cooked: ${error.message}`);
  }
}

// Get cooked meals for a specific date
export async function getCookedMealsForDate(date: string): Promise<MealPlanRecipe[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Find meal plans that cover this date
  const { data: mealPlans, error: mealPlansError } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', user.id)
    .lte('start_date', date)
    .gte('end_date', date);

  if (mealPlansError) {
    throw new Error(`Error finding meal plans for date: ${mealPlansError.message}`);
  }

  if (!mealPlans || mealPlans.length === 0) {
    return [];
  }

  // Get the meal plan IDs
  const mealPlanIds = mealPlans.map(mp => mp.id);

  // Calculate the day index for this date within each meal plan
  const dayIndices = await Promise.all(mealPlans.map(async (mp) => {
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('start_date')
      .eq('id', mp.id)
      .single();

    if (mealPlanError) {
      throw new Error(`Error getting meal plan start date: ${mealPlanError.message}`);
    }

    const startDate = new Date(mealPlan.start_date);
    const targetDate = new Date(date);
    const dayDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return { mealPlanId: mp.id, dayIndex: dayDiff };
  }));

  // Get all cooked meals for these meal plans and day indices
  const { data: cookedMeals, error: cookedMealsError } = await supabase
    .from('meal_plan_recipes')
    .select('*')
    .in('meal_plan_id', mealPlanIds)
    .eq('is_cooked', true)
    .in('day_index', dayIndices.map(di => di.dayIndex));

  if (cookedMealsError) {
    throw new Error(`Error getting cooked meals: ${cookedMealsError.message}`);
  }

  return cookedMeals || [];
}

/**
 * Creates a new meal plan from a single recipe
 * @param params Parameters for creating a meal plan from a recipe
 * @returns The created meal plan
 */
export async function createMealPlanFromRecipe(params: CreateMealPlanFromRecipeParams): Promise<MealPlan> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Determine the start date for the new meal plan
  let startDate: string;

  // Get the latest meal plan to determine the next start date
  const { data: latestPlans, error: latestError } = await supabase
    .from('meal_plans')
    .select('end_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('end_date', { ascending: false })
    .limit(1);

  if (latestError) {
    throw new Error(`Error finding latest meal plan: ${latestError.message}`);
  }

  const today = new Date();

  if (latestPlans && latestPlans.length > 0 && latestPlans[0].end_date) {
    // If there's an existing meal plan, start the new one the day after it ends
    const latestEndDate = new Date(latestPlans[0].end_date);
    latestEndDate.setDate(latestEndDate.getDate() + 1); // Add one day
    startDate = latestEndDate.toISOString().split('T')[0];
  } else {
    // If there's no existing meal plan, start today
    startDate = today.toISOString().split('T')[0];
  }

  // Calculate the end date based on the number of days
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + params.numDays - 1); // -1 because the start day counts as day 1
  const endDateStr = endDate.toISOString().split('T')[0];

  // Check if this would be the current meal plan
  const todayStr = today.toISOString().split('T')[0];
  const is_current = startDate <= todayStr && todayStr <= endDateStr;

  // Create the meal plan
  const { data: mealPlan, error: mealPlanError } = await supabase
    .from('meal_plans')
    .insert({
      user_id: user.id,
      name: params.name,
      description: params.description || null,
      category: params.category || null,
      tags: [],
      start_date: startDate,
      end_date: endDateStr,
      is_current: is_current,
      status: 'active'
    })
    .select()
    .single();

  if (mealPlanError) {
    throw new Error(`Error creating meal plan: ${mealPlanError.message}`);
  }

  // Determine which days to add the recipe to
  const dayIndices = params.dayIndices && params.dayIndices.length > 0
    ? params.dayIndices
    : [0]; // Default to first day if not specified

  console.log('Creating meal plan with days:', dayIndices);

  // Create recipe entries for each selected day
  const recipeEntries = dayIndices.map(dayIndex => ({
    meal_plan_id: mealPlan.id,
    recipe_id: params.recipeId,
    recipe_data: params.recipeData,
    day_index: dayIndex,
    meal_type: params.mealType,
    notes: ''
  }));

  // Add the recipes to the meal plan
  const { error: recipeError } = await supabase
    .from('meal_plan_recipes')
    .insert(recipeEntries);

  if (recipeError) {
    // If there was an error adding the recipe, delete the meal plan
    await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlan.id);

    throw new Error(`Error adding recipe to meal plan: ${recipeError.message}`);
  }

  // If this is the new current meal plan, update other meal plans
  if (is_current) {
    await supabase
      .from('meal_plans')
      .update({ is_current: false })
      .eq('user_id', user.id)
      .neq('id', mealPlan.id);
  }

  // Fetch the created recipes to ensure we have the correct data
  const { data: createdRecipes, error: fetchError } = await supabase
    .from('meal_plan_recipes')
    .select('*')
    .eq('meal_plan_id', mealPlan.id);

  if (fetchError) {
    console.error('Error fetching created recipes:', fetchError.message);
  }

  console.log('Created recipes:', createdRecipes);

  // Return the created meal plan with all the recipes
  return {
    ...mealPlan,
    recipes: createdRecipes || dayIndices.map(dayIndex => ({
      id: '', // We don't have the ID yet, but it's not needed for the UI
      meal_plan_id: mealPlan.id,
      recipe_id: params.recipeId,
      recipe_data: params.recipeData,
      day_index: dayIndex,
      meal_type: params.mealType,
      notes: '',
      is_cooked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  };
}