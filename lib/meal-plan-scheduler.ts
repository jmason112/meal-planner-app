import { updateMealPlanStatusByDate } from './meal-plans';

/**
 * Updates the current meal plan based on the current date.
 * This function should be called when the app starts and can also be scheduled to run periodically.
 */
export async function updateCurrentMealPlan(): Promise<void> {
  try {
    await updateMealPlanStatusByDate();
    console.log('Meal plan status updated successfully');
  } catch (error) {
    console.error('Error updating meal plan status:', error);
  }
}

/**
 * Schedules the meal plan status update to run daily at midnight.
 * This is a client-side implementation and will only work when the app is running.
 * For a more robust solution, consider using a server-side scheduler or push notifications.
 */
export function scheduleMealPlanUpdates(): void {
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
}
