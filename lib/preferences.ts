import { supabase } from './supabase';
import { ProgressTrackingPreferences } from './progress';

export interface UserPreferences {
  id: string;
  user_id: string;
  dietary_preference: string;
  allergies: string[];
  dislikes: string[];
  servings: number;
  meal_reminders: MealReminder[];
  progress_tracking: ProgressTrackingPreferences;
  created_at: string;
  updated_at: string;
}

export interface MealReminder {
  id: string;
  type: 'mealPlanning' | 'shopping' | 'cooking';
  enabled: boolean;
  time: string;
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data: preferences, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }

  return preferences;
}

export async function saveUserPreferences(preferences: Partial<UserPreferences>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Check if preferences already exist for this user
  const { data: existingPrefs, error: checkError } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Error checking existing preferences: ${checkError.message}`);
  }

  const preferencesWithUserId = {
    ...preferences,
    user_id: user.id
  };

  let query;
  if (existingPrefs) {
    // Update existing preferences
    query = supabase
      .from('user_preferences')
      .update(preferencesWithUserId)
      .eq('user_id', user.id);
  } else {
    // Insert new preferences
    query = supabase
      .from('user_preferences')
      .insert(preferencesWithUserId);
  }

  const { data, error } = await query.select().single();

  if (error) {
    throw new Error(`Error saving preferences: ${error.message}`);
  }

  return data;
}

export async function updatePreference(key: keyof UserPreferences, value: any) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      [key]: value,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating preference: ${error.message}`);
  }

  return data;
}

export async function resetPreferences() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const defaultPreferences = {
    user_id: user.id,
    dietary_preference: 'general',
    allergies: [],
    dislikes: [],
    servings: 2,
    meal_reminders: [],
    progress_tracking: {
      enabled: true,
      track_breakfast: true,
      track_lunch: true,
      track_dinner: true,
      track_snack: false,
      track_shopping: true,
      notifications_enabled: true,
      daily_goal_notifications: true,
      achievement_notifications: true
    }
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(defaultPreferences)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error resetting preferences: ${error.message}`);
  }

  return data;
}