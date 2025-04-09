import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { X as XIcon, Calendar, Star, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getMealPlans, MealPlan, updateMealPlanRecipes } from '@/lib/meal-plans';
import { RecipeSearchModal } from './RecipeSearchModal';
import { Recipe } from '@/lib/edamam';
import { ShoppingListToast } from './ShoppingListToast';

interface MealPlanSelectorModalProps {
  onClose: () => void;
  recipeId?: string;
  recipeData?: any;
}

export function MealPlanSelectorModal({
  onClose,
  recipeId,
  recipeData
}: MealPlanSelectorModalProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [showRecipeSearch, setShowRecipeSearch] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('dinner');
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);
  const [maxDays, setMaxDays] = useState(7);

  useEffect(() => {
    loadMealPlans();
  }, []);

  const loadMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await getMealPlans();
      setMealPlans(plans.filter(plan => plan.status === 'active'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: MealPlan) => {
    setSelectedPlan(plan);

    // Set max days based on the actual number of days in the meal plan
    if (plan.recipes && plan.recipes.length > 0) {
      // Find the maximum day_index in the recipes and add 1 (since day_index is 0-based)
      const maxDayIndex = Math.max(...plan.recipes.map(recipe => recipe.day_index)) + 1;
      setMaxDays(maxDayIndex);
    } else if (plan.start_date && plan.end_date) {
      // If no recipes but has start/end dates, calculate from those
      const start = new Date(plan.start_date);
      const end = new Date(plan.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      setMaxDays(diffDays);
    } else {
      // Default to 3 days if no duration is specified
      setMaxDays(3);
    }

    if (recipeId && recipeData) {
      // If recipe is provided, show day selector
      setShowDaySelector(true);
    } else {
      // Otherwise, show recipe search modal
      setShowRecipeSearch(true);
    }
  };

  const handleAddToPlan = async () => {
    if (!selectedPlan || !recipeId || !recipeData || selectedDays.length === 0) return;

    try {
      // Get existing recipes
      const existingRecipes = selectedPlan.recipes || [];

      // Create new recipe entries for each selected day
      const newRecipes = selectedDays.map(dayIndex => ({
        recipe_id: recipeId,
        recipe_data: recipeData,
        day_index: dayIndex,
        meal_type: selectedMealType,
        notes: ''
      }));

      // Add the new recipes to the existing recipes
      const updatedRecipes = [...existingRecipes, ...newRecipes];

      // Update the meal plan - but don't replace all recipes, just add the new ones
      await updateMealPlanRecipes(selectedPlan.id, updatedRecipes, false);

      // Show success toast
      const mealTypeCapitalized = selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1);
      const daysText = selectedDays.length === 1
        ? `Day ${selectedDays[0] + 1}`
        : `${selectedDays.length} days`;
      setToastMessage(`Added ${recipeData.title} as ${mealTypeCapitalized} to ${daysText} of ${selectedPlan.name}`);
      setShowToast(true);

      // Wait for toast to show before closing
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipe to meal plan');
    }
  };

  const toggleDaySelection = (dayIndex: number) => {
    setSelectedDays(prev => {
      // If day is already selected, remove it
      if (prev.includes(dayIndex)) {
        return prev.filter(day => day !== dayIndex);
      }
      // Otherwise add it
      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  };

  const toggleAllDays = () => {
    if (selectedDays.length === maxDays) {
      // If all days are selected, deselect all except the first day
      setSelectedDays([0]);
    } else {
      // Otherwise select all days
      setSelectedDays(Array.from({ length: maxDays }, (_, i) => i));
    }
  };

  // Ensure selected days are within the valid range when maxDays changes
  useEffect(() => {
    setSelectedDays(prev => prev.filter(day => day < maxDays));

    // If no days are selected after filtering, select the first day
    if (selectedDays.length === 0) {
      setSelectedDays([0]);
    }
  }, [maxDays]);

  const handleSelectRecipe = async (recipe: Recipe, mealType: string, dayIndex: number) => {
    if (!selectedPlan) return;

    try {
      // Get existing recipes
      const existingRecipes = selectedPlan.recipes || [];

      // Create new recipe entry
      const newRecipe = {
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
      };

      // Add the new recipe to the existing recipes
      const updatedRecipes = [...existingRecipes, newRecipe];

      // Update the meal plan - but don't replace all recipes, just add the new one
      await updateMealPlanRecipes(selectedPlan.id, updatedRecipes, false);

      // Show success toast
      setToastMessage(`Added ${recipe.label} to ${selectedPlan.name}`);
      setShowToast(true);

      // Close the recipe search modal
      setShowRecipeSearch(false);

      // Wait for toast to show before closing
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipe to meal plan');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeIn}
        style={styles.modal}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Meal Plan</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <XIcon size={24} color="#264653" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2A9D8F" />
              <Text style={styles.loadingText}>Loading meal plans...</Text>
            </View>
          ) : mealPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Meal Plans Found</Text>
              <Text style={styles.emptyText}>
                Create a meal plan first to add recipes to it.
              </Text>
            </View>
          ) : (
            mealPlans.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => handleSelectPlan(plan)}
              >
                <View style={styles.planCardContent}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.is_favorite && (
                      <Star size={16} color="#FFB800" fill="#FFB800" />
                    )}
                  </View>

                  {plan.description && (
                    <Text style={styles.planDescription} numberOfLines={2}>
                      {plan.description}
                    </Text>
                  )}

                  <View style={styles.planMeta}>
                    <View style={styles.planMetaItem}>
                      <Calendar size={14} color="#666" />
                      <Text style={styles.planMetaText}>
                        {formatDate(plan.start_date)}
                      </Text>
                    </View>

                    {plan.category && (
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>{plan.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Animated.View>

      {showRecipeSearch && selectedPlan && (
        <RecipeSearchModal
          onClose={() => setShowRecipeSearch(false)}
          onSelectRecipe={handleSelectRecipe}
          initialMealType="dinner"
          initialDayIndex={0}
        />
      )}

      {showDaySelector && selectedPlan && (
        <View style={styles.overlay}>
          <Animated.View
            entering={FadeIn}
            style={styles.daySelectorModal}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Select Day</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDaySelector(false)}
              >
                <XIcon size={24} color="#264653" />
              </TouchableOpacity>
            </View>

            <View style={styles.daySelectorContent}>
              <Text style={styles.daySelectorText}>
                Select which day to add this recipe to in your meal plan:
              </Text>

              <View style={styles.daySelectionHeader}>
                <Text style={styles.daySelectionTitle}>Select Days:</Text>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={toggleAllDays}
                >
                  <Text style={styles.selectAllButtonText}>
                    {selectedDays.length === maxDays ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: maxDays }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dayItem,
                      selectedDays.includes(i) && styles.dayItemSelected
                    ]}
                    onPress={() => toggleDaySelection(i)}
                  >
                    <Text style={[
                      styles.dayItemText,
                      selectedDays.includes(i) && styles.dayItemTextSelected
                    ]}>
                      Day {i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.mealTypeContainer}>
                <Text style={styles.mealTypeLabel}>Meal Type:</Text>
                <View style={styles.mealTypeOptions}>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.mealTypeOption, type === selectedMealType && styles.mealTypeOptionSelected]}
                      onPress={() => setSelectedMealType(type)}
                    >
                      <Text
                        style={[styles.mealTypeOptionText, type === selectedMealType && styles.mealTypeOptionTextSelected]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.daySelectorFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDaySelector(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddToPlan}
              >
                <Text style={styles.addButtonText}>
                  Add {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} to {selectedDays.length === 1 ? `Day ${selectedDays[0] + 1}` : `${selectedDays.length} Days`}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      <ShoppingListToast
        visible={showToast}
        onHide={() => setShowToast(false)}
        message={toastMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    height: '80%',
    maxHeight: 800,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#DC2626',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  planCardContent: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginRight: 8,
    marginBottom: 4,
  },
  planDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  planMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  categoryChip: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  daySelectorModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  daySelectorContent: {
    padding: 24,
  },
  daySelectorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    marginBottom: 24,
    textAlign: 'center',
  },
  daySelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  daySelectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectAllButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 70,
    alignItems: 'center',
  },
  dayItemSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  dayItemText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
  },
  dayItemTextSelected: {
    color: '#fff',
  },
  mealTypeContainer: {
    marginBottom: 24,
  },
  mealTypeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#264653',
    marginBottom: 12,
  },
  mealTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  mealTypeOptionSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  mealTypeOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  mealTypeOptionTextSelected: {
    color: '#fff',
  },
  daySelectorFooter: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2A9D8F',
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#fff',
  },
});
