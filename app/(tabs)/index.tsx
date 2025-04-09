import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Users, Bookmark, Plus, Coffee } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { getMealPlans, getCurrentMealPlan } from '@/lib/meal-plans';
import { getShoppingList } from '@/lib/shopping';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('there');
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1); // Tuesday by default
  const [shoppingItems, setShoppingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadMealPlan();
    loadShoppingList();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      loadUserData(),
      loadMealPlan(),
      loadShoppingList()
    ])
      .catch(error => console.error('Error refreshing data:', error))
      .finally(() => setRefreshing(false));
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name.split(' ')[0]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMealPlan = async () => {
    try {
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
        }
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setLoading(false);
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

  const getDayName = (index) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[index];
  };

  const getMealsForDay = (dayIndex) => {
    if (!mealPlan || !mealPlan.recipes) return [];
    return mealPlan.recipes.filter(recipe => recipe.day_index === dayIndex);
  };

  const getRecentRecipes = () => {
    if (!mealPlan || !mealPlan.recipes) return [];
    return mealPlan.recipes.slice(0, 3);
  };

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
            <Image source={{ uri: "https://ui-avatars.com/api/?name=" + userName }} style={styles.profileImage} />
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
            <View style={styles.mealProgress}>
              <View style={styles.mealCircle}>
                <View style={[styles.mealCircleFill, { height: "75%" }]} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>Breakfast</Text>
                <Text style={styles.mealStatus}>Completed</Text>
              </View>
            </View>
            <View style={styles.mealProgress}>
              <View style={styles.mealCircle}>
                <View style={[styles.mealCircleFill, { height: "0%" }]} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>Lunch</Text>
                <Text style={styles.mealStatus}>Upcoming • 12:30 PM</Text>
              </View>
            </View>
            <View style={styles.mealProgress}>
              <View style={styles.mealCircle}>
                <View style={[styles.mealCircleFill, { height: "0%" }]} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>Dinner</Text>
                <Text style={styles.mealStatus}>Upcoming • 7:00 PM</Text>
              </View>
            </View>
          </View>
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
            {getRecentRecipes().map((recipe, index) => (
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
              onPress={() => mealPlan ? router.push(`/meal-planner/edit?id=${mealPlan.id}`) : router.push('/meal-planner/create')}
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
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.mealPlanCard}>
                {getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'breakfast').length > 0 ? (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Breakfast</Text>
                      <Text style={styles.mealPlanTimeSubtext}>8:00 AM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <Image
                        source={{ uri: getMealsForDay(selectedDay).find(meal => meal.meal_type === 'breakfast')?.recipe_data.image }}
                        style={styles.mealPlanImage}
                      />
                      <View style={styles.mealPlanDetails}>
                        <Text style={styles.mealPlanTitle}>
                          {getMealsForDay(selectedDay).find(meal => meal.meal_type === 'breakfast')?.recipe_data.title}
                        </Text>
                        <View style={styles.mealPlanActions}>
                          <TouchableOpacity style={styles.mealPlanAction}>
                            <Bookmark size={14} color="#2A9D8F" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Breakfast</Text>
                      <Text style={styles.mealPlanTimeSubtext}>8:00 AM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <TouchableOpacity
                        style={styles.addMealButton}
                        onPress={() => router.push(`/meal-planner/edit?id=${mealPlan.id}`)}
                      >
                        <Plus size={20} color="#2A9D8F" />
                      </TouchableOpacity>
                      <Text style={styles.addMealText}>Add a meal</Text>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                {getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'lunch').length > 0 ? (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Lunch</Text>
                      <Text style={styles.mealPlanTimeSubtext}>12:30 PM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <Image
                        source={{ uri: getMealsForDay(selectedDay).find(meal => meal.meal_type === 'lunch')?.recipe_data.image }}
                        style={styles.mealPlanImage}
                      />
                      <View style={styles.mealPlanDetails}>
                        <Text style={styles.mealPlanTitle}>
                          {getMealsForDay(selectedDay).find(meal => meal.meal_type === 'lunch')?.recipe_data.title}
                        </Text>
                        <View style={styles.mealPlanActions}>
                          <TouchableOpacity style={styles.mealPlanAction}>
                            <Bookmark size={14} color="#2A9D8F" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Lunch</Text>
                      <Text style={styles.mealPlanTimeSubtext}>12:30 PM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <TouchableOpacity
                        style={styles.addMealButton}
                        onPress={() => router.push(`/meal-planner/edit?id=${mealPlan.id}`)}
                      >
                        <Plus size={20} color="#2A9D8F" />
                      </TouchableOpacity>
                      <Text style={styles.addMealText}>Add a meal</Text>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                {getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'dinner').length > 0 ? (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Dinner</Text>
                      <Text style={styles.mealPlanTimeSubtext}>7:00 PM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <Image
                        source={{ uri: getMealsForDay(selectedDay).find(meal => meal.meal_type === 'dinner')?.recipe_data.image }}
                        style={styles.mealPlanImage}
                      />
                      <View style={styles.mealPlanDetails}>
                        <Text style={styles.mealPlanTitle}>
                          {getMealsForDay(selectedDay).find(meal => meal.meal_type === 'dinner')?.recipe_data.title}
                        </Text>
                        <View style={styles.mealPlanActions}>
                          <TouchableOpacity style={styles.mealPlanAction}>
                            <Bookmark size={14} color="#2A9D8F" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Dinner</Text>
                      <Text style={styles.mealPlanTimeSubtext}>7:00 PM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <TouchableOpacity
                        style={styles.addMealButton}
                        onPress={() => router.push(`/meal-planner/edit?id=${mealPlan.id}`)}
                      >
                        <Plus size={20} color="#2A9D8F" />
                      </TouchableOpacity>
                      <Text style={styles.addMealText}>Add a meal</Text>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                {getMealsForDay(selectedDay).filter(meal => meal.meal_type === 'snack').length > 0 ? (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Snack</Text>
                      <Text style={styles.mealPlanTimeSubtext}>4:00 PM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <Image
                        source={{ uri: getMealsForDay(selectedDay).find(meal => meal.meal_type === 'snack')?.recipe_data.image }}
                        style={styles.mealPlanImage}
                      />
                      <View style={styles.mealPlanDetails}>
                        <Text style={styles.mealPlanTitle}>
                          {getMealsForDay(selectedDay).find(meal => meal.meal_type === 'snack')?.recipe_data.title}
                        </Text>
                        <View style={styles.mealPlanActions}>
                          <TouchableOpacity style={styles.mealPlanAction}>
                            <Bookmark size={14} color="#2A9D8F" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mealPlanItem}>
                    <View style={styles.mealPlanTime}>
                      <Text style={styles.mealPlanTimeText}>Snack</Text>
                      <Text style={styles.mealPlanTimeSubtext}>4:00 PM</Text>
                    </View>
                    <View style={styles.mealPlanContent}>
                      <TouchableOpacity
                        style={styles.addMealButton}
                        onPress={() => router.push(`/meal-planner/edit?id=${mealPlan.id}`)}
                      >
                        <Coffee size={20} color="#2A9D8F" />
                      </TouchableOpacity>
                      <Text style={styles.addMealText}>Add a snack</Text>
                    </View>
                  </View>
                )}
              </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileImage: {
    width: "100%",
    height: "100%",
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
  mealProgress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mealCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2A9D8F",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  mealCircleFill: {
    width: "100%",
    backgroundColor: "#2A9D8F",
  },
  mealInfo: {
    marginLeft: 12,
  },
  mealTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#264653",
  },
  mealStatus: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#ADB5BD",
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
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
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
});