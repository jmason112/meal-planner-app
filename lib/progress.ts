import { supabase } from './supabase';

export interface UserProgress {
  id: string;
  user_id: string;
  date: string;
  meal_plan_id: string | null;
  breakfast_completed: boolean;
  lunch_completed: boolean;
  dinner_completed: boolean;
  snack_completed: boolean;
  shopping_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchievementType {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  requirements: {
    meal_plans_created?: number;
    recipes_cooked?: number;
    consecutive_days?: number;
    shopping_lists_completed?: number;
    healthy_recipes?: number;
    cuisine_types?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type_id: string;
  achieved_at: string | null;
  progress: {
    meal_plans_created?: number;
    recipes_cooked?: number;
    consecutive_days?: number;
    shopping_lists_completed?: number;
    healthy_recipes?: number;
    cuisine_types?: number;
  };
  completed: boolean;
  created_at: string;
  updated_at: string;
  achievement_type?: AchievementType;
}

export interface RewardType {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  points_required: number;
  created_at: string;
  updated_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_type_id: string;
  earned_at: string;
  redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
  updated_at: string;
  reward_type?: RewardType;
}

export interface ProgressTrackingPreferences {
  enabled: boolean;
  track_breakfast: boolean;
  track_lunch: boolean;
  track_dinner: boolean;
  track_snack: boolean;
  track_shopping: boolean;
  notifications_enabled: boolean;
  daily_goal_notifications: boolean;
  achievement_notifications: boolean;
}

// Get today's progress
export async function getTodayProgress(): Promise<UserProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
    throw new Error(`Error fetching today's progress: ${error.message}`);
  }

  return data || null;
}

// Get progress for a specific date
export async function getProgressForDate(date: string): Promise<UserProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching progress for date: ${error.message}`);
  }

  return data || null;
}

// Get progress for a date range
export async function getProgressForDateRange(startDate: string, endDate: string): Promise<UserProgress[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Error fetching progress for date range: ${error.message}`);
  }

  return data || [];
}

// Update progress for today
export async function updateTodayProgress(progress: Partial<UserProgress>): Promise<UserProgress> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Check if progress exists for today
  const { data: existingProgress, error: checkError } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Error checking existing progress: ${checkError.message}`);
  }

  let result;

  if (existingProgress) {
    // Update existing progress
    const { data, error } = await supabase
      .from('user_progress')
      .update(progress)
      .eq('id', existingProgress.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating progress: ${error.message}`);
    }

    result = data;
  } else {
    // Create new progress
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        date: today,
        ...progress
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating progress: ${error.message}`);
    }

    result = data;
  }

  // Trigger achievement check
  await checkAndUpdateAchievements();

  return result;
}

// Mark a meal as completed
export async function markMealCompleted(mealPlanId: string, recipeId: string, dayIndex: number, mealType: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Update the meal_plan_recipe record
  const { error } = await supabase
    .from('meal_plan_recipes')
    .update({ is_cooked: true })
    .eq('meal_plan_id', mealPlanId)
    .eq('recipe_id', recipeId)
    .eq('day_index', dayIndex)
    .eq('meal_type', mealType);

  if (error) {
    throw new Error(`Error marking meal as completed: ${error.message}`);
  }
}

// Mark a meal as not completed
export async function markMealNotCompleted(mealPlanId: string, recipeId: string, dayIndex: number, mealType: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Update the meal_plan_recipe record
  const { error } = await supabase
    .from('meal_plan_recipes')
    .update({ is_cooked: false })
    .eq('meal_plan_id', mealPlanId)
    .eq('recipe_id', recipeId)
    .eq('day_index', dayIndex)
    .eq('meal_type', mealType);

  if (error) {
    throw new Error(`Error marking meal as not completed: ${error.message}`);
  }
}

// Mark shopping as completed
export async function markShoppingCompleted(date: string = new Date().toISOString().split('T')[0]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Check if progress exists for the date
  const { data: existingProgress, error: checkError } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Error checking existing progress: ${checkError.message}`);
  }

  if (existingProgress) {
    // Update existing progress
    const { error } = await supabase
      .from('user_progress')
      .update({ shopping_completed: true })
      .eq('id', existingProgress.id);

    if (error) {
      throw new Error(`Error updating shopping completion: ${error.message}`);
    }
  } else {
    // Create new progress
    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        date,
        shopping_completed: true
      });

    if (error) {
      throw new Error(`Error creating shopping completion: ${error.message}`);
    }
  }

  // Trigger achievement check
  await checkAndUpdateAchievements();
}

// Get user achievements
export async function getUserAchievements(): Promise<UserAchievement[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement_type:achievement_type_id(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching user achievements: ${error.message}`);
  }

  return data || [];
}

// Get completed user achievements
export async function getCompletedAchievements(): Promise<UserAchievement[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement_type:achievement_type_id(*)
    `)
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('achieved_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching completed achievements: ${error.message}`);
  }

  return data || [];
}

// Get in-progress achievements
export async function getInProgressAchievements(): Promise<UserAchievement[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement_type:achievement_type_id(*)
    `)
    .eq('user_id', user.id)
    .eq('completed', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching in-progress achievements: ${error.message}`);
  }

  return data || [];
}

// Get user rewards
export async function getUserRewards(): Promise<UserReward[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_rewards')
    .select(`
      *,
      reward_type:reward_type_id(*)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching user rewards: ${error.message}`);
  }

  return data || [];
}

// Redeem a reward
export async function redeemReward(rewardId: string): Promise<UserReward> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_rewards')
    .update({
      redeemed: true,
      redeemed_at: new Date().toISOString()
    })
    .eq('id', rewardId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error redeeming reward: ${error.message}`);
  }

  return data;
}

// Get progress tracking preferences
export async function getProgressTrackingPreferences(): Promise<ProgressTrackingPreferences> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('progress_tracking')
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`Error fetching progress tracking preferences: ${error.message}`);
  }

  return data.progress_tracking as ProgressTrackingPreferences;
}

// Update progress tracking preferences
export async function updateProgressTrackingPreferences(preferences: Partial<ProgressTrackingPreferences>): Promise<ProgressTrackingPreferences> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Get current preferences
  const { data: currentPrefs, error: getError } = await supabase
    .from('user_preferences')
    .select('progress_tracking')
    .eq('user_id', user.id)
    .single();

  if (getError) {
    throw new Error(`Error fetching current progress tracking preferences: ${getError.message}`);
  }

  // Merge with new preferences
  const updatedPrefs = {
    ...currentPrefs.progress_tracking,
    ...preferences
  };

  // Update preferences
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      progress_tracking: updatedPrefs
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating progress tracking preferences: ${error.message}`);
  }

  return data.progress_tracking as ProgressTrackingPreferences;
}

// Check and update achievements
export async function checkAndUpdateAchievements(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found when checking achievements');
      return;
    }

    // Call the database function to check and update achievements
    const { error } = await supabase.rpc('check_and_update_achievements', {
      user_id_param: user.id
    });

    if (error) {
      console.error(`Error checking and updating achievements: ${error.message}`);
    }
  } catch (err) {
    console.error('Error in checkAndUpdateAchievements:', err);
  }
}

// Get user stats
export async function getUserStats(): Promise<{
  totalMealsCooked: number;
  totalMealPlansCreated: number;
  currentStreak: number;
  longestStreak: number;
  completedAchievements: number;
  totalPoints: number;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found when getting stats');
      return {
        totalMealsCooked: 0,
        totalMealPlansCreated: 0,
        currentStreak: 0,
        longestStreak: 0,
        completedAchievements: 0,
        totalPoints: 0
      };
    }

    // Get total meals cooked
    // First get the meal plan IDs
    const { data: mealPlansData, error: mealPlansQueryError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id);

    if (mealPlansQueryError) {
      console.error(`Error fetching meal plans: ${mealPlansQueryError.message}`);
      return {
        totalMealsCooked: 0,
        totalMealPlansCreated: 0,
        currentStreak: 0,
        longestStreak: 0,
        completedAchievements: 0,
        totalPoints: 0
      };
    }

    // Then get the cooked meals
    const mealPlanIds = mealPlansData.map(mp => mp.id);

    let mealsData = [];
    if (mealPlanIds.length > 0) {
      const { data: cookedMealsData, error: mealsError } = await supabase
        .from('meal_plan_recipes')
        .select('id')
        .eq('is_cooked', true)
        .in('meal_plan_id', mealPlanIds);

      if (mealsError) {
        console.error(`Error fetching total meals cooked: ${mealsError.message}`);
        return {
          totalMealsCooked: 0,
          totalMealPlansCreated: mealPlansData.length,
          currentStreak: 0,
          longestStreak: 0,
          completedAchievements: 0,
          totalPoints: 0
        };
      }

      mealsData = cookedMealsData || [];
    }

    // This block is now handled in the nested query above

    // We already have the meal plans data from above
    const plansData = mealPlansData;

    // Get completed achievements
    const { data: achievementsData, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_type_id, achievement_type:achievement_type_id(points)')
      .eq('user_id', user.id)
      .eq('completed', true);

    if (achievementsError) {
      console.error(`Error fetching completed achievements: ${achievementsError.message}`);
      return {
        totalMealsCooked: mealsData?.length || 0,
        totalMealPlansCreated: plansData?.length || 0,
        currentStreak: 0,
        longestStreak: 0,
        completedAchievements: 0,
        totalPoints: 0
      };
    }

    // Calculate total points
    const totalPoints = achievementsData.reduce((sum, achievement) => {
      return sum + (achievement.achievement_type?.points || 0);
    }, 0);

    // Calculate streak
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('date, breakfast_completed, lunch_completed, dinner_completed')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (progressError) {
      console.error(`Error fetching progress data: ${progressError.message}`);
      return {
        totalMealsCooked: mealsData?.length || 0,
        totalMealPlansCreated: plansData?.length || 0,
        completedAchievements: achievementsData?.length || 0,
        totalPoints,
        currentStreak: 0,
        longestStreak: 0
      };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Sort progress data by date in descending order
    const sortedProgressData = progressData && progressData.length > 0
      ? [...progressData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];

    // Calculate current streak
    for (const progress of sortedProgressData) {
      const progressDate = new Date(progress.date);
      const anyMealCompleted = progress.breakfast_completed || progress.lunch_completed || progress.dinner_completed;

      if (!anyMealCompleted) {
        break;
      }

      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          currentStreak += 1;
        } else {
          break;
        }
      }

      lastDate = progressDate;
    }

    // Calculate longest streak
    lastDate = null;
    const chronologicalProgressData = progressData && progressData.length > 0
      ? [...progressData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : [];
    for (const progress of chronologicalProgressData) {
      const progressDate = new Date(progress.date);
      const anyMealCompleted = progress.breakfast_completed || progress.lunch_completed || progress.dinner_completed;

      if (anyMealCompleted) {
        if (lastDate === null) {
          tempStreak = 1;
        } else {
          const dayDiff = Math.floor((progressDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            tempStreak += 1;
          } else {
            tempStreak = 1;
          }
        }

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }

      lastDate = progressDate;
    }

    return {
      totalMealsCooked: mealsData?.length || 0,
      totalMealPlansCreated: plansData?.length || 0,
      currentStreak,
      longestStreak,
      completedAchievements: achievementsData?.length || 0,
      totalPoints
    };
  } catch (err) {
    console.error('Error in getUserStats:', err);
    return {
      totalMealsCooked: 0,
      totalMealPlansCreated: 0,
      currentStreak: 0,
      longestStreak: 0,
      completedAchievements: 0,
      totalPoints: 0
    };
  }
}
