import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getTodayProgress, updateTodayProgress, UserProgress } from '@/lib/progress';
import { getProgressTrackingPreferences, ProgressTrackingPreferences } from '@/lib/progress';
import { Coffee, UtensilsCrossed, Soup, Cookie, ShoppingBag, Check } from 'lucide-react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DailyProgressProps {
  date?: string; // Optional date, defaults to today
  onUpdate?: (progress: UserProgress) => void;
  refreshTrigger?: number; // Pass a changing value to trigger refresh
}

export default function DailyProgress({ date, onUpdate, refreshTrigger }: DailyProgressProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [preferences, setPreferences] = useState<ProgressTrackingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Animation values
  const breakfastScale = useSharedValue(1);
  const lunchScale = useSharedValue(1);
  const dinnerScale = useSharedValue(1);
  const snackScale = useSharedValue(1);
  const shoppingScale = useSharedValue(1);

  useEffect(() => {
    loadData();
  }, [date, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progressData, prefsData] = await Promise.all([
        getTodayProgress(),
        getProgressTrackingPreferences()
      ]);
      
      setProgress(progressData);
      setPreferences(prefsData);
    } catch (err) {
      console.error('Error loading progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!progress || updating) return;
    
    const scaleValue = 
      mealType === 'breakfast' ? breakfastScale :
      mealType === 'lunch' ? lunchScale :
      mealType === 'dinner' ? dinnerScale : snackScale;
    
    // Animate the scale
    scaleValue.value = withSpring(1.2, {}, () => {
      scaleValue.value = withSpring(1);
    });
    
    try {
      setUpdating(mealType);
      
      // Toggle the completion status
      const updatedValue = !progress[`${mealType}_completed`];
      
      // Update in the database
      const updatedProgress = await updateTodayProgress({
        [`${mealType}_completed`]: updatedValue
      });
      
      // Update local state
      setProgress(updatedProgress);
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updatedProgress);
      }
    } catch (err) {
      console.error(`Error updating ${mealType} status:`, err);
      setError(`Failed to update ${mealType} status`);
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleShopping = async () => {
    if (!progress || updating) return;
    
    // Animate the scale
    shoppingScale.value = withSpring(1.2, {}, () => {
      shoppingScale.value = withSpring(1);
    });
    
    try {
      setUpdating('shopping');
      
      // Toggle the completion status
      const updatedValue = !progress.shopping_completed;
      
      // Update in the database
      const updatedProgress = await updateTodayProgress({
        shopping_completed: updatedValue
      });
      
      // Update local state
      setProgress(updatedProgress);
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updatedProgress);
      }
    } catch (err) {
      console.error('Error updating shopping status:', err);
      setError('Failed to update shopping status');
    } finally {
      setUpdating(null);
    }
  };

  // Animated styles
  const breakfastStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breakfastScale.value }],
  }));
  
  const lunchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lunchScale.value }],
  }));
  
  const dinnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dinnerScale.value }],
  }));
  
  const snackStyle = useAnimatedStyle(() => ({
    transform: [{ scale: snackScale.value }],
  }));
  
  const shoppingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shoppingScale.value }],
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Default progress object if none exists
  const currentProgress = progress || {
    breakfast_completed: false,
    lunch_completed: false,
    dinner_completed: false,
    snack_completed: false,
    shopping_completed: false
  } as UserProgress;

  // Only show meal types that are enabled in preferences
  const showBreakfast = preferences?.track_breakfast !== false;
  const showLunch = preferences?.track_lunch !== false;
  const showDinner = preferences?.track_dinner !== false;
  const showSnack = preferences?.track_snack === true;
  const showShopping = preferences?.track_shopping !== false;

  return (
    <View style={styles.container}>
      <View style={styles.mealsContainer}>
        {showBreakfast && (
          <Animated.View style={[styles.mealItem, breakfastStyle]}>
            <TouchableOpacity
              style={[
                styles.mealButton,
                currentProgress.breakfast_completed && styles.mealCompleted
              ]}
              onPress={() => handleToggleMeal('breakfast')}
              disabled={updating !== null}
            >
              {updating === 'breakfast' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : currentProgress.breakfast_completed ? (
                <Check size={24} color="#FFFFFF" />
              ) : (
                <Coffee size={24} color="#264653" />
              )}
            </TouchableOpacity>
            <Text style={styles.mealLabel}>Breakfast</Text>
          </Animated.View>
        )}
        
        {showLunch && (
          <Animated.View style={[styles.mealItem, lunchStyle]}>
            <TouchableOpacity
              style={[
                styles.mealButton,
                currentProgress.lunch_completed && styles.mealCompleted
              ]}
              onPress={() => handleToggleMeal('lunch')}
              disabled={updating !== null}
            >
              {updating === 'lunch' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : currentProgress.lunch_completed ? (
                <Check size={24} color="#FFFFFF" />
              ) : (
                <UtensilsCrossed size={24} color="#264653" />
              )}
            </TouchableOpacity>
            <Text style={styles.mealLabel}>Lunch</Text>
          </Animated.View>
        )}
        
        {showDinner && (
          <Animated.View style={[styles.mealItem, dinnerStyle]}>
            <TouchableOpacity
              style={[
                styles.mealButton,
                currentProgress.dinner_completed && styles.mealCompleted
              ]}
              onPress={() => handleToggleMeal('dinner')}
              disabled={updating !== null}
            >
              {updating === 'dinner' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : currentProgress.dinner_completed ? (
                <Check size={24} color="#FFFFFF" />
              ) : (
                <Soup size={24} color="#264653" />
              )}
            </TouchableOpacity>
            <Text style={styles.mealLabel}>Dinner</Text>
          </Animated.View>
        )}
        
        {showSnack && (
          <Animated.View style={[styles.mealItem, snackStyle]}>
            <TouchableOpacity
              style={[
                styles.mealButton,
                currentProgress.snack_completed && styles.mealCompleted
              ]}
              onPress={() => handleToggleMeal('snack')}
              disabled={updating !== null}
            >
              {updating === 'snack' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : currentProgress.snack_completed ? (
                <Check size={24} color="#FFFFFF" />
              ) : (
                <Cookie size={24} color="#264653" />
              )}
            </TouchableOpacity>
            <Text style={styles.mealLabel}>Snack</Text>
          </Animated.View>
        )}
      </View>
      
      {showShopping && (
        <Animated.View style={[styles.shoppingContainer, shoppingStyle]}>
          <TouchableOpacity
            style={[
              styles.shoppingButton,
              currentProgress.shopping_completed && styles.shoppingCompleted
            ]}
            onPress={handleToggleShopping}
            disabled={updating !== null}
          >
            {updating === 'shopping' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <ShoppingBag size={20} color={currentProgress.shopping_completed ? "#FFFFFF" : "#264653"} />
                <Text style={[
                  styles.shoppingText,
                  currentProgress.shopping_completed && styles.shoppingCompletedText
                ]}>
                  {currentProgress.shopping_completed ? 'Shopping Completed' : 'Mark Shopping Complete'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  mealsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mealItem: {
    alignItems: 'center',
  },
  mealButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F9F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealCompleted: {
    backgroundColor: '#2A9D8F',
  },
  mealLabel: {
    fontSize: 14,
    color: '#264653',
    fontWeight: '500',
  },
  shoppingContainer: {
    marginTop: 8,
  },
  shoppingButton: {
    flexDirection: 'row',
    backgroundColor: '#F0F9F8',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shoppingCompleted: {
    backgroundColor: '#2A9D8F',
  },
  shoppingText: {
    fontSize: 14,
    color: '#264653',
    fontWeight: '500',
    marginLeft: 8,
  },
  shoppingCompletedText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6C757D',
  },
  errorContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#E76F51',
    textAlign: 'center',
  },
});
