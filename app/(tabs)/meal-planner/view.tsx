import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit, Star, Tag as TagIcon, CircleAlert as AlertCircle, Clock, Users, ChevronRight, ShoppingBag, ChefHat, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getMealPlans, toggleFavorite, setCurrentMealPlan, markMealAsCooked, markMealAsNotCooked, type MealPlan } from '@/lib/meal-plans';
import { InstacartModal } from '@/components/InstacartModal';
import { createShoppingList, ShoppingListEntry, getRecipeDetails } from '@/lib/edamam';
import { addToShoppingList, ShoppingItem, toggleItemChecked as toggleItemCheckedApi } from '@/lib/shopping';
import { checkAndUpdateAchievements } from '@/lib/progress';
import { supabase } from '@/lib/supabase';

export default function ViewMealPlan() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstacartModal, setShowInstacartModal] = useState(false);
  const [isCreatingShoppingList, setIsCreatingShoppingList] = useState(false);
  const [markingAsCooked, setMarkingAsCooked] = useState<string | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    loadMealPlan();
  }, [id]);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await getMealPlans();
      const plan = plans.find(p => p.id === id);

      if (!plan) {
        throw new Error('Meal plan not found');
      }

      setMealPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!mealPlan) return;

    try {
      await toggleFavorite(mealPlan.id);
      setMealPlan(prev => prev ? {
        ...prev,
        is_favorite: !prev.is_favorite
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite status');
    }
  };

  const handleSetAsCurrent = async () => {
    if (!mealPlan) return;

    try {
      const updatedPlan = await setCurrentMealPlan(mealPlan.id);
      setMealPlan(prev => prev ? {
        ...prev,
        is_current: true
      } : null);
      // Show success message or toast here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set as current meal plan');
    }
  };

  const handleViewRecipe = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleToggleCooked = async (recipe: any) => {
    if (markingAsCooked) return;

    try {
      setMarkingAsCooked(recipe.id);

      if (recipe.is_cooked) {
        // Mark as not cooked
        await markMealAsNotCooked(
          mealPlan!.id,
          recipe.recipe_id,
          recipe.day_index,
          recipe.meal_type
        );
      } else {
        // Mark as cooked
        await markMealAsCooked(
          mealPlan!.id,
          recipe.recipe_id,
          recipe.day_index,
          recipe.meal_type
        );
      }

      // Update local state
      setMealPlan(prev => {
        if (!prev) return null;

        return {
          ...prev,
          recipes: prev.recipes?.map(r =>
            r.id === recipe.id
              ? { ...r, is_cooked: !r.is_cooked }
              : r
          )
        };
      });

      // Update achievements
      await checkAndUpdateAchievements();
    } catch (err) {
      console.error('Error toggling cooked status:', err);
    } finally {
      setMarkingAsCooked(null);
    }
  };

  const handleEditMealPlan = () => {
    router.push(`/meal-planner/edit?id=${id}`);
  };

  const handleAddToInstacart = () => {
    setShowInstacartModal(true);
  };

  const createInstacartList = async (): Promise<{ url?: string; sentItems?: ShoppingItem[] }> => {
    if (!mealPlan || !mealPlan.recipes || mealPlan.recipes.length === 0) {
      throw new Error('No recipes found in this meal plan');
    }

    try {
      setIsCreatingShoppingList(true);

      // Create entries for the shopping list API
      const entries: ShoppingListEntry[] = mealPlan.recipes.map(recipe => ({
        quantity: recipe.recipe_data.servings || 1,
        measure: 'http://www.edamam.com/ontologies/edamam.owl#Measure_serving',
        recipe: `http://www.edamam.com/ontologies/edamam.owl#recipe_${recipe.recipe_id.replace('recipe_', '')}`
      }));

      // Add to local shopping list
      let shoppingItems: ShoppingItem[] = [];
      try {
        // Extract all ingredients from the meal plan
        const tempItems = [];

        // For each recipe in the meal plan, add its ingredients to the shopping list
        for (const recipe of mealPlan.recipes) {
          try {
            // Get detailed recipe information including ingredients
            const recipeDetails = await getRecipeDetails(recipe.recipe_id);

            // Add each ingredient to the shopping list
            const ingredients = recipeDetails.ingredients.map(ingredient => ({
              id: Math.random().toString(),
              name: ingredient.food,
              quantity: `${ingredient.quantity} ${ingredient.measure}`,
              recipe: recipe.recipe_data.title,
              recipe_id: recipe.recipe_id,
              checked: false
            }));

            tempItems.push(...ingredients);
          } catch (error) {
            console.error(`Error getting ingredients for ${recipe.recipe_data.title}:`, error);
          }
        }

        // Add all items to the shopping list
        if (tempItems.length > 0) {
          console.log('Adding to local shopping list:', tempItems.length, 'items');
          await addToShoppingList(tempItems);
          console.log('Successfully added to local shopping list');
          shoppingItems = tempItems;
          setShoppingItems(tempItems); // Update the state with the shopping items
        }
      } catch (err) {
        console.error('Error adding to local shopping list:', err);
      }

      // Call the API to create a shopping list
      const response = await createShoppingList(entries);

      // Get the shopping cart URL from the response
      const cartUrl = response.shoppingCartUrl ||
                     (response._links?.['shopping-cart']?.href);

      if (!cartUrl) {
        console.warn('No shopping cart URL found in the response');
      }

      return {
        url: cartUrl,
        sentItems: shoppingItems
      };
    } catch (error) {
      console.error('Error creating Instacart shopping list:', error);
      throw error;
    } finally {
      setIsCreatingShoppingList(false);
    }
  };

  const markItemsAsChecked = async (itemIds: string[]) => {
    try {
      console.log('Marking items as checked:', itemIds.length);

      // Get the current shopping list to find matching items
      const { data: currentShoppingList, error: listError } = await supabase
        .from('shopping_list_items')
        .select('id, name, recipe, recipe_id')
        .eq('checked', false);

      if (listError) {
        console.error('Error fetching shopping list:', listError);
        return;
      }

      if (!currentShoppingList || currentShoppingList.length === 0) {
        console.log('No items found in shopping list');
        return;
      }

      // Find items in the shopping list that match the sent items
      // We'll match by recipe_id and name since the IDs won't match
      const sentItems = itemIds.map(id => {
        // Find the sent item in the shopping items array
        const sentItem = shoppingItems.find(item => item.id === id);
        return sentItem;
      }).filter(Boolean);

      // Find matching items in the current shopping list
      const itemsToCheck = [];
      for (const sentItem of sentItems) {
        // Find items in the shopping list with the same recipe_id and name
        const matchingItems = currentShoppingList.filter(item =>
          item.recipe_id === sentItem.recipe_id &&
          item.name.toLowerCase() === sentItem.name.toLowerCase()
        );

        itemsToCheck.push(...matchingItems.map(item => item.id));
      }

      console.log(`Found ${itemsToCheck.length} matching items in shopping list`);

      // Mark each matching item as checked
      for (const id of itemsToCheck) {
        await toggleItemCheckedApi(id);
      }

      return;
    } catch (error) {
      console.error('Error marking items as checked:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading meal plan...</Text>
      </View>
    );
  }

  if (error || !mealPlan) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#E76F51" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadMealPlan}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group recipes by day
  const recipesByDay = mealPlan.recipes?.reduce((acc, recipe) => {
    if (!acc[recipe.day_index]) {
      acc[recipe.day_index] = [];
    }
    acc[recipe.day_index].push(recipe);
    return acc;
  }, {} as Record<number, typeof mealPlan.recipes>);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#264653" />
        </TouchableOpacity>
        <Text style={styles.title}>{mealPlan.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleFavorite}
          >
            <Star
              size={24}
              color={mealPlan.is_favorite ? '#FFB800' : '#666'}
              fill={mealPlan.is_favorite ? '#FFB800' : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEditMealPlan}
          >
            <Edit size={24} color="#2A9D8F" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsContainer}>
          {mealPlan.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{mealPlan.description}</Text>
            </View>
          )}

          {mealPlan.category && (
            <View style={styles.categoryContainer}>
              <TagIcon size={16} color="#2A9D8F" />
              <Text style={styles.categoryText}>{mealPlan.category}</Text>
            </View>
          )}

          {mealPlan.tags && mealPlan.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {mealPlan.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {!mealPlan.is_current && (
            <TouchableOpacity
              style={styles.setCurrentButton}
              onPress={handleSetAsCurrent}
            >
              <Text style={styles.setCurrentButtonText}>Set as Current Meal Plan</Text>
            </TouchableOpacity>
          )}

          {mealPlan.is_current && (
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanText}>Current Meal Plan</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meals</Text>
            <TouchableOpacity
              style={styles.editSectionButton}
              onPress={handleEditMealPlan}
            >
              <Edit size={20} color="#2A9D8F" />
              <Text style={styles.editSectionButtonText}>Edit Meal Plan</Text>
            </TouchableOpacity>
          </View>

          {recipesByDay && Object.entries(recipesByDay).map(([dayIndex, recipes]) => (
            <View key={dayIndex} style={styles.dayContainer}>
              <Text style={styles.dayTitle}>Day {parseInt(dayIndex) + 1}</Text>
              {recipes?.map((recipe) => (
                <View key={recipe.id} style={styles.mealCardContainer}>
                  <Animated.View
                    entering={FadeInDown.delay(300)}
                    style={styles.mealCard}
                  >
                    <TouchableOpacity
                      style={styles.mealCardContent}
                      onPress={() => handleViewRecipe(recipe.recipe_id)}
                    >
                      <Image
                        source={{ uri: recipe.recipe_data.image }}
                        style={styles.mealImage}
                      />
                      <View style={styles.mealContent}>
                        <View style={styles.mealTypeContainer}>
                          <Text style={styles.mealType}>
                            {recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1)}
                          </Text>
                        </View>
                        <Text style={styles.mealTitle}>{recipe.recipe_data.title}</Text>
                        <View style={styles.mealMeta}>
                          <View style={styles.metaItem}>
                            <Clock size={14} color="#666" />
                            <Text style={styles.metaText}>{recipe.recipe_data.time}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Users size={14} color="#666" />
                            <Text style={styles.metaText}>{recipe.recipe_data.servings} servings</Text>
                          </View>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#666" style={styles.chevron} />
                    </TouchableOpacity>
                  </Animated.View>
                  <TouchableOpacity
                    style={[styles.cookedButton, recipe.is_cooked && styles.cookedButtonActive]}
                    onPress={() => handleToggleCooked(recipe)}
                    disabled={markingAsCooked !== null}
                  >
                    {markingAsCooked === recipe.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : recipe.is_cooked ? (
                      <Check size={16} color="#FFFFFF" />
                    ) : (
                      <ChefHat size={16} color="#264653" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(400)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleAddToInstacart}
        >
          <ShoppingBag size={20} color="#fff" />
          <Text style={styles.orderButtonText}>Order from Instacart</Text>
        </TouchableOpacity>
      </Animated.View>

      <InstacartModal
        visible={showInstacartModal}
        onClose={() => setShowInstacartModal(false)}
        onConfirm={createInstacartList}
        onMarkItemsAsChecked={markItemsAsChecked}
        isLoading={isCreatingShoppingList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  setCurrentButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  setCurrentButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  currentPlanBadge: {
    backgroundColor: '#F0F9F8',
    borderWidth: 1,
    borderColor: '#2A9D8F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  currentPlanText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2A9D8F',
  },
  dayContainer: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  dayTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 12,
  },
  mealCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cookedButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cookedButtonActive: {
    backgroundColor: '#2A9D8F',
  },
  mealCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealImage: {
    width: 100,
    height: 100,
  },
  mealContent: {
    flex: 1,
    padding: 12,
  },
  mealTypeContainer: {
    backgroundColor: '#E9ECEF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  mealType: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#666',
  },
  mealTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginBottom: 8,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  editSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  editSectionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  orderButton: {
    backgroundColor: '#E76F51', // Changed to a more attention-grabbing color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  orderButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  chevron: {
    marginRight: 12,
  },
});
