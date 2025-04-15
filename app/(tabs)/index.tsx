import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, Clock, Users, Bookmark, Plus, Coffee } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { getMealPlans, getCurrentMealPlan, getWeekMealPlans, type MealPlan } from '@/lib/meal-plans';
import { getShoppingList, type ShoppingItem } from '@/lib/shopping';
import { checkAndUpdateAchievements } from '@/lib/progress';
import { getUserProfile, getLevelInfo, type UserProfile, type LevelInfo } from '@/lib/profile';
import ProfileImage from '@/components/ProfileImage';
import EmptyHomeState from '@/components/EmptyHomeState';
import DailyProgress from '@/components/DailyProgress';
import ProgressStats from '@/components/ProgressStats';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('there');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [weekMealPlans, setWeekMealPlans] = useState<MealPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay()); // Current day by default
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    loadUserData();
    loadMealPlan();
    loadShoppingList();
    checkAndUpdateAchievements().catch(err => console.error('Error checking achievements:', err));
  }, []);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Home screen focused - refreshing data');
      loadUserData();
      loadMealPlan();
      loadShoppingList();
      checkAndUpdateAchievements().catch(err => console.error('Error checking achievements:', err));
      setRefreshTrigger(prev => prev + 1);
      return () => {};
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      loadUserData(),
      loadMealPlan(),
      loadShoppingList(),
      checkAndUpdateAchievements()
    ])
      .catch(error => console.error('Error refreshing data:', error))
      .finally(() => {
        setRefreshing(false);
        setRefreshTrigger(prev => prev + 1);
      });
  }, []);

  const loadUserData = async () => {
    try {
      // Get basic user info from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name.split(' ')[0]);
      }

      // Get user profile
      const userProfile = await getUserProfile();

      // No need to verify avatar URL here anymore - ProfileImage component will handle it

      setProfile(userProfile);

      // Get level info
      const levelData = await getLevelInfo();
      setLevelInfo(levelData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMealPlan = async () => {
    try {
      setLoading(true);

      // Try to get the current meal plan first
      const currentPlan = await getCurrentMealPlan();

      if (currentPlan) {
        setMealPlan(currentPlan);
      } else {
        // Fall back to getting the most recent active plan
        const plans = await getMealPlans({
          status: 'active',
          sort_by: 'start_date',
          sort_direction: 'desc'
        });

        if (plans.length > 0) {
          setMealPlan(plans[0]);
        } else {
          // If no plans found, explicitly set mealPlan to null
          setMealPlan(null);
        }
      }

      // Load all meal plans for the current week
      const weekPlans = await getWeekMealPlans();
      setWeekMealPlans(weekPlans);
    } catch (error) {
      console.error('Error loading meal plan:', error);
      // Ensure states are reset on error
      setMealPlan(null);
      setWeekMealPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false); // Ensure refreshing is reset
    }
  };

  const loadShoppingList = async () => {
    try {
      const items = await getShoppingList();
      setShoppingItems(items);
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDayName = (index: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  };

  const getFormattedDate = (dayIndex: number): string => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const diff = dayIndex - currentDayOfWeek;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);

    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMealsForDay = (dayIndex: number): any[] => {
    // Get the date for the selected day
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const diff = dayIndex - currentDayOfWeek;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Collect meals from all relevant meal plans for this day
    let allMeals: any[] = [];

    weekMealPlans.forEach(plan => {
      // Check if this plan covers the target date
      if (plan.start_date && plan.end_date &&
          plan.start_date <= targetDateStr &&
          plan.end_date >= targetDateStr &&
          plan.recipes) {

        // Calculate the day index within this specific meal plan
        const planStartDate = new Date(plan.start_date);
        const daysSincePlanStart = Math.floor((targetDate.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));

        // Add meals for this day from this plan
        const planMeals = plan.recipes.filter((recipe: any) => recipe.day_index === daysSincePlanStart);
        allMeals = [...allMeals, ...planMeals];
      }
    });

    return allMeals;
  };

  const getRecentRecipes = (): any[] => {
    if (!mealPlan || !mealPlan.recipes) return [];
    return mealPlan.recipes.slice(0, 3);
  };

  // Show loading indicator
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading your meal plans...</Text>
      </View>
    );
  }

  // Show empty state if there are no meal plans
  if (!loading && !refreshing && (!mealPlan || !weekMealPlans.length)) {
    return <EmptyHomeState userName={userName} />;
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={["#2A9D8F", "#264653"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
            <ProfileImage
              uri={profile?.avatar_url || null}
              username={profile?.username || userName}
              size={40}
              style={styles.profileImage}
            />
            {levelInfo && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{levelInfo.currentLevel}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2A9D8F"
            colors={['#2A9D8F']}
            progressBackgroundColor="#F1F9F9"
            title="Refreshing your meal plan..."
            titleColor="#2A9D8F"
          />
        }
      >
        {/* Daily Progress Section */}
        <Animated.View key={`progress-${refreshing}`} entering={FadeInDown.delay(200)} style={styles.progressContainer}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressCard}>
            <DailyProgress
              refreshTrigger={refreshTrigger}
              onUpdate={() => setRefreshTrigger(prev => prev + 1)}
            />
          </View>
        </Animated.View>

        {/* Progress Stats Section */}
        <Animated.View key={`stats-${refreshing}`} entering={FadeInDown.delay(250)} style={styles.statsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/profile/achievements')}>
              <Text style={styles.viewAllText}>View all</Text>
              <ChevronRight size={16} color="#2A9D8F" />
            </TouchableOpacity>
          </View>
          <ProgressStats refreshTrigger={refreshTrigger} />
        </Animated.View>

        {/* Recent Recipes */}
        <Animated.View key={`recipes-${refreshing}`} entering={FadeInDown.delay(300)} style={styles.recipesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Recipes</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/recipe-index')}>
              <Text style={styles.viewAllText}>View all</Text>
              <ChevronRight size={16} color="#2A9D8F" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesScroll}>
            {getRecentRecipes().map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${recipe.recipe_id}`)}
              >
                <Image source={{ uri: recipe.recipe_data.image }} style={styles.recipeImage} />
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.recipe_data.title}</Text>
                  <View style={styles.recipeMetaContainer}>
                    <View style={styles.recipeMeta}>
                      <Clock size={12} color="#ADB5BD" />
                      <Text style={styles.recipeMetaText}>{recipe.recipe_data.time}</Text>
                    </View>
                    <View style={styles.recipeMeta}>
                      <Users size={12} color="#ADB5BD" />
                      <Text style={styles.recipeMetaText}>{recipe.recipe_data.servings} servings</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Weekly Meal Plan */}
        <Animated.View key={`mealplan-${refreshing}`} entering={FadeInDown.delay(400)} style={styles.mealPlanContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week's Plan</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => mealPlan ? router.push(`/meal-planner/edit?id=${mealPlan?.id}`) : router.push('/meal-planner/create')}
            >
              <Text style={styles.viewAllText}>{mealPlan ? 'Edit plan' : 'Create plan'}</Text>
              <ChevronRight size={16} color="#2A9D8F" />
            </TouchableOpacity>
          </View>

          {mealPlan ? (
            <>
              <View style={styles.daysContainer}>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayButton, selectedDay === day ? styles.activeDayButton : null]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.dayText, selectedDay === day ? styles.activeDayText : null]}>{getDayName(day)}</Text>
                    <Text style={[styles.dayDateText, selectedDay === day ? styles.activeDayDateText : null]}>{getFormattedDate(day)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.mealPlanCard}>
                {(() => {
                  const breakfastMeals = getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'breakfast');
                  const breakfastCount = breakfastMeals.length;

                  if (breakfastCount > 0) {
                    return (
                      <View style={styles.mealPlanItem}>
                        <View style={styles.mealPlanTime}>
                          <Text style={styles.mealPlanTimeText}>Breakfast</Text>
                          <Text style={styles.mealPlanTimeSubtext}>8:00 AM</Text>
                          {breakfastCount > 1 && (
                            <View style={styles.mealCountBadge}>
                              <Text style={styles.mealCountText}>{breakfastCount}</Text>
                            </View>
                          )}
                        </View>
                        {breakfastCount === 1 ? (
                          <View style={styles.mealPlanContent}>
                            <Image
                              source={{ uri: breakfastMeals[0]?.recipe_data.image }}
                              style={styles.mealPlanImage}
                            />
                            <View style={styles.mealPlanDetails}>
                              <Text style={styles.mealPlanTitle}>
                                {breakfastMeals[0]?.recipe_data.title}
                              </Text>
                              <View style={styles.mealPlanActions}>
                                <TouchableOpacity style={styles.mealPlanAction}>
                                  <Bookmark size={14} color="#2A9D8F" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.multipleMealsContainer}
                          >
                            {breakfastMeals.map((meal, index) => (
                              <View key={meal.id} style={[styles.mealPlanContent, styles.multipleMealItem]}>
                                <Image
                                  source={{ uri: meal.recipe_data.image }}
                                  style={styles.mealPlanImage}
                                />
                                <View style={styles.mealPlanDetails}>
                                  <Text style={styles.mealPlanTitle}>
                                    {meal.recipe_data.title}
                                  </Text>
                                  <View style={styles.mealPlanActions}>
                                    <TouchableOpacity style={styles.mealPlanAction}>
                                      <Bookmark size={14} color="#2A9D8F" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                                {index < breakfastMeals.length - 1 && (
                                  <View style={styles.mealIndicator}>
                                    <ChevronRight size={16} color="#2A9D8F" />
                                  </View>
                                )}
                              </View>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    );
                  }
                  return null;
                })()}

                {(() => {
                  const breakfastMeals = getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'breakfast');
                  return breakfastMeals.length === 0 && (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Breakfast</Text>
                      <Text style={styles.mealPlanTimeSubtext}>8:00 AM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <TouchableOpacity
                        style={styles.addMealButton}
                        onPress={() => router.push(`/meal-planner/edit?id=${mealPlan?.id}`)}
                      >
                        <Plus size={20} color="#2A9D8F" />
                      </TouchableOpacity>
                      <Text style={styles.addMealText}>Add a meal</Text>
                    </View>
                  </View>
                  );
                })()}

                {<View style={styles.divider} />}

                {(() => {
                  const lunchMeals = getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'lunch');
                  const lunchCount = lunchMeals.length;

                  if (lunchCount > 0) {
                    return (
                      <View style={styles.mealPlanItem}>
                        <View style={styles.mealPlanTime}>
                          <Text style={styles.mealPlanTimeText}>Lunch</Text>
                          <Text style={styles.mealPlanTimeSubtext}>12:30 PM</Text>
                          {lunchCount > 1 && (
                            <View style={styles.mealCountBadge}>
                              <Text style={styles.mealCountText}>{lunchCount}</Text>
                            </View>
                          )}
                        </View>
                        {lunchCount === 1 ? (
                          <View style={styles.mealPlanContent}>
                            <Image
                              source={{ uri: lunchMeals[0]?.recipe_data.image }}
                              style={styles.mealPlanImage}
                            />
                            <View style={styles.mealPlanDetails}>
                              <Text style={styles.mealPlanTitle}>
                                {lunchMeals[0]?.recipe_data.title}
                              </Text>
                              <View style={styles.mealPlanActions}>
                                <TouchableOpacity style={styles.mealPlanAction}>
                                  <Bookmark size={14} color="#2A9D8F" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.multipleMealsContainer}
                          >
                            {lunchMeals.map((meal, index) => (
                              <View key={meal.id} style={[styles.mealPlanContent, styles.multipleMealItem]}>
                                <Image
                                  source={{ uri: meal.recipe_data.image }}
                                  style={styles.mealPlanImage}
                                />
                                <View style={styles.mealPlanDetails}>
                                  <Text style={styles.mealPlanTitle}>
                                    {meal.recipe_data.title}
                                  </Text>
                                  <View style={styles.mealPlanActions}>
                                    <TouchableOpacity style={styles.mealPlanAction}>
                                      <Bookmark size={14} color="#2A9D8F" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                                {index < lunchMeals.length - 1 && (
                                  <View style={styles.mealIndicator}>
                                    <ChevronRight size={16} color="#2A9D8F" />
                                  </View>
                                )}
                              </View>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    );
                  }
                  return (
                    <View style={styles.mealPlanItem}>
                      <View style={styles.mealPlanTime}>
                        <Text style={styles.mealPlanTimeText}>Lunch</Text>
                        <Text style={styles.mealPlanTimeSubtext}>12:30 PM</Text>
                      </View>
                      <View style={styles.mealPlanContent}>
                        <TouchableOpacity
                          style={styles.addMealButton}
                          onPress={() => router.push(`/meal-planner/edit?id=${mealPlan?.id}`)}
                        >
                          <Plus size={20} color="#2A9D8F" />
                        </TouchableOpacity>
                        <Text style={styles.addMealText}>Add a meal</Text>
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.divider} />

                {(() => {
                  const dinnerMeals = getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'dinner');
                  const dinnerCount = dinnerMeals.length;

                  if (dinnerCount > 0) {
                    return (
                      <View style={styles.mealPlanItem}>
                        <View style={styles.mealPlanTime}>
                          <Text style={styles.mealPlanTimeText}>Dinner</Text>
                          <Text style={styles.mealPlanTimeSubtext}>7:00 PM</Text>
                          {dinnerCount > 1 && (
                            <View style={styles.mealCountBadge}>
                              <Text style={styles.mealCountText}>{dinnerCount}</Text>
                            </View>
                          )}
                        </View>
                        {dinnerCount === 1 ? (
                          <View style={styles.mealPlanContent}>
                            <Image
                              source={{ uri: dinnerMeals[0]?.recipe_data.image }}
                              style={styles.mealPlanImage}
                            />
                            <View style={styles.mealPlanDetails}>
                              <Text style={styles.mealPlanTitle}>
                                {dinnerMeals[0]?.recipe_data.title}
                              </Text>
                              <View style={styles.mealPlanActions}>
                                <TouchableOpacity style={styles.mealPlanAction}>
                                  <Bookmark size={14} color="#2A9D8F" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.multipleMealsContainer}
                          >
                            {dinnerMeals.map((meal, index) => (
                              <View key={meal.id} style={[styles.mealPlanContent, styles.multipleMealItem]}>
                                <Image
                                  source={{ uri: meal.recipe_data.image }}
                                  style={styles.mealPlanImage}
                                />
                                <View style={styles.mealPlanDetails}>
                                  <Text style={styles.mealPlanTitle}>
                                    {meal.recipe_data.title}
                                  </Text>
                                  <View style={styles.mealPlanActions}>
                                    <TouchableOpacity style={styles.mealPlanAction}>
                                      <Bookmark size={14} color="#2A9D8F" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                                {index < dinnerMeals.length - 1 && (
                                  <View style={styles.mealIndicator}>
                                    <ChevronRight size={16} color="#2A9D8F" />
                                  </View>
                                )}
                              </View>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    );
                  }
                  return (
                    <View style={styles.mealPlanItem}>
                      <View style={styles.mealPlanTime}>
                        <Text style={styles.mealPlanTimeText}>Dinner</Text>
                        <Text style={styles.mealPlanTimeSubtext}>7:00 PM</Text>
                      </View>
                      <View style={styles.mealPlanContent}>
                        <TouchableOpacity
                          style={styles.addMealButton}
                          onPress={() => router.push(`/meal-planner/edit?id=${mealPlan?.id}`)}
                        >
                          <Plus size={20} color="#2A9D8F" />
                        </TouchableOpacity>
                        <Text style={styles.addMealText}>Add a meal</Text>
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.divider} />

                {(() => {
                  const snackMeals = getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'snack');
                  const snackCount = snackMeals.length;

                  if (snackCount > 0) {
                    return (
                      <View style={styles.mealPlanItem}>
                        <View style={styles.mealPlanTime}>
                          <Text style={styles.mealPlanTimeText}>Snack</Text>
                          <Text style={styles.mealPlanTimeSubtext}>4:00 PM</Text>
                          {snackCount > 1 && (
                            <View style={styles.mealCountBadge}>
                              <Text style={styles.mealCountText}>{snackCount}</Text>
                            </View>
                          )}
                        </View>
                        {snackCount === 1 ? (
                          <View style={styles.mealPlanContent}>
                            <Image
                              source={{ uri: snackMeals[0]?.recipe_data.image }}
                              style={styles.mealPlanImage}
                            />
                            <View style={styles.mealPlanDetails}>
                              <Text style={styles.mealPlanTitle}>
                                {snackMeals[0]?.recipe_data.title}
                              </Text>
                              <View style={styles.mealPlanActions}>
                                <TouchableOpacity style={styles.mealPlanAction}>
                                  <Bookmark size={14} color="#2A9D8F" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.multipleMealsContainer}
                          >
                            {snackMeals.map((meal, index) => (
                              <View key={meal.id} style={[styles.mealPlanContent, styles.multipleMealItem]}>
                                <Image
                                  source={{ uri: meal.recipe_data.image }}
                                  style={styles.mealPlanImage}
                                />
                                <View style={styles.mealPlanDetails}>
                                  <Text style={styles.mealPlanTitle}>
                                    {meal.recipe_data.title}
                                  </Text>
                                  <View style={styles.mealPlanActions}>
                                    <TouchableOpacity style={styles.mealPlanAction}>
                                      <Bookmark size={14} color="#2A9D8F" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                                {index < snackMeals.length - 1 && (
                                  <View style={styles.mealIndicator}>
                                    <ChevronRight size={16} color="#2A9D8F" />
                                  </View>
                                )}
                              </View>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    );
                  }
                  return (
                    <View style={styles.mealPlanItem}>
                      <View style={styles.mealPlanTime}>
                        <Text style={styles.mealPlanTimeText}>Snack</Text>
                        <Text style={styles.mealPlanTimeSubtext}>4:00 PM</Text>
                      </View>
                      <View style={styles.mealPlanContent}>
                        <TouchableOpacity
                          style={styles.addMealButton}
                          onPress={() => router.push(`/meal-planner/edit?id=${mealPlan?.id}`)}
                        >
                          <Coffee size={20} color="#2A9D8F" />
                        </TouchableOpacity>
                        <Text style={styles.addMealText}>Add a snack</Text>
                      </View>
                    </View>
                  );
                })()
              }</View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.createPlanCard}
              onPress={() => router.push('/meal-planner/create')}
            >
              <Plus size={24} color="#2A9D8F" />
              <Text style={styles.createPlanText}>Create your first meal plan</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Shopping List Reminder */}
        <Animated.View key={`shopping-${refreshing}`} entering={FadeInDown.delay(500)} style={styles.shoppingReminderContainer}>
          <TouchableOpacity
            style={styles.shoppingReminderCard}
            onPress={() => router.push('/shopping')}
          >
            <View style={styles.shoppingReminderContent}>
              <View style={styles.shoppingReminderTextContainer}>
                <Text style={styles.shoppingReminderTitle}>Shopping List</Text>
                <Text style={styles.shoppingReminderSubtitle}>
                  {shoppingItems.length > 0
                    ? `You have ${shoppingItems.length} items to buy`
                    : 'Your shopping list is empty'}
                </Text>
              </View>
              <View style={styles.shoppingReminderButton}>
                <Text style={styles.shoppingReminderButtonText}>View List</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#264653',
    marginTop: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Inter-Bold",
  },
  profileButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "visible",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  levelBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#E9C46A",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  levelText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    color: "#264653",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#264653",
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsContainer: {
    marginTop: 24,
  },
  recipesContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#2A9D8F",
    marginRight: 4,
  },
  recipesScroll: {
    marginLeft: -8,
  },
  recipeCard: {
    width: 160,
    marginLeft: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeImage: {
    width: "100%",
    height: 120,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#264653",
    marginBottom: 4,
  },
  recipeMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  recipeMetaText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#ADB5BD",
    marginLeft: 4,
  },
  mealPlanContainer: {
    marginTop: 24,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    width: 50,
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 5,
  },
  activeDayButton: {
    backgroundColor: "#2A9D8F",
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#ADB5BD",
  },
  activeDayText: {
    color: "#FFFFFF",
  },
  dayDateText: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    color: "#ADB5BD",
    marginTop: 4,
  },
  activeDayDateText: {
    color: "#FFFFFF",
    opacity: 0.8,
  },
  mealPlanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealPlanItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  mealPlanTime: {
    width: 80,
  },
  mealPlanTimeText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#264653",
  },
  mealPlanTimeSubtext: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#ADB5BD",
  },
  mealPlanContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  mealPlanImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  mealPlanDetails: {
    flex: 1,
    marginLeft: 12,
  },
  mealPlanTitle: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#264653",
  },
  mealPlanActions: {
    flexDirection: "row",
    marginTop: 4,
  },
  mealPlanAction: {
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E9ECEF",
  },
  addMealButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F9F9",
    justifyContent: "center",
    alignItems: "center",
  },
  addMealText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#2A9D8F",
  },
  createPlanCard: {
    backgroundColor: "#F1F9F9",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  createPlanText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#2A9D8F",
  },
  shoppingReminderContainer: {
    marginTop: 24,
  },
  shoppingReminderCard: {
    backgroundColor: "#F4A261",
    borderRadius: 16,
    overflow: "hidden",
  },
  shoppingReminderContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shoppingReminderTextContainer: {
    flex: 1,
  },
  shoppingReminderTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  shoppingReminderSubtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#FFFFFF",
    opacity: 0.8,
  },
  shoppingReminderButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shoppingReminderButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#F4A261",
  },
  // New styles for multiple meals
  mealCountBadge: {
    backgroundColor: "#2A9D8F",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  mealCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter-Bold",
  },
  multipleMealsContainer: {
    flexGrow: 0,
    maxHeight: 120,
  },
  multipleMealItem: {
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    paddingRight: 8,
  },
  mealIndicator: {
    position: "absolute",
    right: -4,
    top: "50%",
    marginTop: -12,
    backgroundColor: "#F1F9F9",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
});