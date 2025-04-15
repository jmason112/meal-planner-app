import { updateMealPlanStatusByDate, getCurrentMealPlan } from './meal-plans';
import { AppState, AppStateStatus } from 'react-native';

// Store the last date we checked for meal plan updates
let lastCheckedDate: string = '';

/**
 * Updates the current meal plan based on the current date.
 * This function should be called when the app starts and when it comes to the foreground.
 */
export async function updateCurrentMealPlan(): Promise<void> {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Only run the update if we haven't checked today or if this is the first check
    if (today !== lastCheckedDate) {
      console.log(`Checking meal plan status for date: ${today} (last checked: ${lastCheckedDate || 'never'})`);
      await updateMealPlanStatusByDate();
      lastCheckedDate = today;
      console.log('Meal plan status updated successfully');

      // Log the current meal plan for debugging
      const currentPlan = await getCurrentMealPlan();
      if (currentPlan) {
        console.log(`Current meal plan: ${currentPlan.name} (${currentPlan.start_date} to ${currentPlan.end_date})`);
      } else {
        console.log('No current meal plan found');
      }
    } else {
      console.log(`Meal plan already checked today (${today}), skipping update`);
    }
  } catch (error) {
    console.error('Error updating meal plan status:', error);
  }
}

/**
 * Schedules the meal plan status update to run daily at midnight
 * and also when the app comes to the foreground.
 */
export function scheduleMealPlanUpdates(): void {
  // Set up app state change listener to check when app comes to foreground
  AppState.addEventListener('change', handleAppStateChange);

  // Get the current time
  const now = new Date();

  // Calculate the time until midnight
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const timeUntilMidnight = midnight.getTime() - now.getTime();

  // Schedule the first update at midnight
  setTimeout(() => {
    // Run the update
    updateCurrentMealPlan();

    // Then schedule it to run every 24 hours
    setInterval(updateCurrentMealPlan, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  console.log(`Scheduled next meal plan check at midnight (in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes)`);
}

/**
 * Handles app state changes to update meal plans when the app comes to the foreground
 */
async function handleAppStateChange(nextAppState: AppStateStatus) {
  if (nextAppState === 'active') {
    console.log('App has come to the foreground, checking meal plan status');
    await updateCurrentMealPlan();
  }
}
