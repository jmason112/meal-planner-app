import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Trash2, Star, Tag as TagIcon, CircleAlert as AlertCircle, Plus, Clock, Users, ChevronRight, ShoppingBag, Search } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getMealPlans, updateMealPlan, deleteMealPlan, toggleFavorite, updateMealPlanRecipes, type MealPlan } from '@/lib/meal-plans';
import { getRecipeDetails, createShoppingList, ShoppingListEntry } from '@/lib/edamam';
import { InstacartModal } from '@/components/InstacartModal';
import { RecipeSearchModal } from '@/components/RecipeSearchModal';
import { addToShoppingList, ShoppingItem } from '@/lib/shopping';

export default function EditMealPlan() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [showInstacartModal, setShowInstacartModal] = useState(false);
  const [isCreatingShoppingList, setIsCreatingShoppingList] = useState(false);
  const [showRecipeSearch, setShowRecipeSearch] = useState(false);

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
      setName(plan.name);
      setDescription(plan.description || '');
      setCategory(plan.category);
      setTags(plan.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mealPlan) return;

    try {
      setSaving(true);
      setError(null);

      await updateMealPlan(mealPlan.id, {
        name,
        description: description || null,
        category: category || null,
        tags
      });

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!mealPlan) return;

    try {
      await deleteMealPlan(mealPlan.id);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal plan');
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

  const handleRemoveMeal = async (recipeId: string) => {
    if (!mealPlan || !mealPlan.recipes) return;

    try {
      const updatedRecipes = mealPlan.recipes.filter(recipe => recipe.recipe_id !== recipeId);
      await updateMealPlanRecipes(mealPlan.id, updatedRecipes);

      // Update local state
      setMealPlan(prev => prev ? {
        ...prev,
        recipes: updatedRecipes
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove meal');
    }
  };

  const handleAddMeal = () => {
    setShowRecipeSearch(true);
  };

  const handleAddRecipe = async (recipe: any, mealType: string, dayIndices: number[]) => {
    if (!mealPlan) return;

    try {
      // Get existing recipes
      const existingRecipes = mealPlan.recipes || [];

      // Create new recipe entries for each selected day
      const newRecipes = dayIndices.map(dayIndex => ({
        recipe_id: recipe.uri.split('#recipe_')[1],
        recipe_data: {
          id: recipe.uri.split('#recipe_')[1],
          title: recipe.label,
          image: recipe.image,
          time: recipe.totalTime ? `${recipe.totalTime} min` : 'N/A',
          servings: recipe.yield || 2,
          calories: Math.round(recipe.calories / (recipe.yield || 1)),
          rating: 4
        },
        day_index: dayIndex,
        meal_type: mealType,
        notes: ''
      }));

      // Add the new recipes to the existing recipes
      const updatedRecipes = [...existingRecipes, ...newRecipes];

      // Update the meal plan - but don't replace all recipes, just add the new ones
      await updateMealPlanRecipes(mealPlan.id, updatedRecipes, false);

      // Reload the meal plan to show the new recipes
      await loadMealPlan();

      // Close the recipe search modal
      setShowRecipeSearch(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipe to meal plan');
    }
  };

  const handleViewRecipe = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleAddToInstacart = () => {
    setShowInstacartModal(true);
  };

  const createInstacartList = async (): Promise<string | undefined> => {
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
      try {
        // Extract all ingredients from the meal plan
        const shoppingItems = [];

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

            shoppingItems.push(...ingredients);
          } catch (error) {
            console.error(`Error getting ingredients for ${recipe.recipe_data.title}:`, error);
          }
        }

        // Add all items to the shopping list
        if (shoppingItems.length > 0) {
          console.log('Adding to local shopping list:', shoppingItems.length, 'items');
          await addToShoppingList(shoppingItems);
          console.log('Successfully added to local shopping list');
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

      return cartUrl;
    } catch (error) {
      console.error('Error creating Instacart shopping list:', error);
      throw error;
    } finally {
      setIsCreatingShoppingList(false);
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
        <Text style={styles.title}>Edit Meal Plan</Text>
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
            style={[styles.headerButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash2 size={24} color="#E76F51" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter meal plan name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category || ''}
              onChangeText={setCategory}
              placeholder="Add a category"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <TagIcon size={16} color="#2A9D8F" />
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => setTags(tags.filter((_, i) => i !== index))}
                  >
                    <Text style={styles.removeTag}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Add tags (press Enter to add)"
              onSubmitEditing={(e) => {
                const newTag = e.nativeEvent.text.trim();
                if (newTag && !tags.includes(newTag)) {
                  setTags([...tags, newTag]);
                }
                e.currentTarget.clear();
              }}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meals</Text>
              <TouchableOpacity
                style={styles.instacartButton}
                onPress={handleAddToInstacart}
              >
                <ShoppingBag size={20} color="#2A9D8F" />
                <Text style={styles.instacartButtonText}>Order from Instacart</Text>
              </TouchableOpacity>
            </View>
            {recipesByDay && Object.entries(recipesByDay).map(([dayIndex, recipes]) => (
              <View key={dayIndex} style={styles.dayContainer}>
                <Text style={styles.dayTitle}>Day {parseInt(dayIndex) + 1}</Text>
                {recipes?.map((recipe) => (
                  <View key={recipe.id} style={styles.mealCard}>
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
                    <TouchableOpacity
                      style={styles.removeMealButton}
                      onPress={() => handleRemoveMeal(recipe.recipe_id)}
                    >
                      <Trash2 size={20} color="#E76F51" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addMealButton}
              onPress={handleAddMeal}
            >
              <Search size={20} color="#2A9D8F" />
              <Text style={styles.addMealText}>Search & Add Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(400)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <InstacartModal
        visible={showInstacartModal}
        onClose={() => setShowInstacartModal(false)}
        onConfirm={createInstacartList}
        isLoading={isCreatingShoppingList}
      />

      {showRecipeSearch && mealPlan && (
        <RecipeSearchModal
          onClose={() => setShowRecipeSearch(false)}
          onSelectRecipe={handleAddRecipe}
          maxDays={mealPlan.recipes ? Math.max(...mealPlan.recipes.map(r => r.day_index)) + 1 : 7}
          mealPlanId={mealPlan.id}
        />
      )}
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
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
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
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 8,
  },
  tagText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  removeTag: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
  },
  instacartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  instacartButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
  },
  dayContainer: {
    marginBottom: 24,
  },
  dayTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
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
  removeMealButton: {
    padding: 12,
    justifyContent: 'center',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A9D8F',
    borderStyle: 'dashed',
    gap: 8,
  },
  addMealText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#2A9D8F',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  saveButton: {
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  chevron: {
    marginRight: 12,
  },
});