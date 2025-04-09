import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Clock, Users, Plus, Minus } from 'lucide-react-native';
import { z } from 'zod';
import { generateMealPlan, getRecipeDetails } from '@/lib/edamam';
import { addToShoppingList } from '@/lib/shopping';
import { MealPlanResults } from '@/components/MealPlanResults';

const HEALTH_LABELS = [
  { id: 'alcohol-free', label: 'Alcohol-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'egg-free', label: 'Egg-Free' },
  { id: 'fish-free', label: 'Fish-Free' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'keto-friendly', label: 'Keto' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'low-sugar', label: 'Low Sugar' },
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'peanut-free', label: 'Peanut-Free' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'pork-free', label: 'Pork-Free' },
  { id: 'soy-free', label: 'Soy-Free' },
  { id: 'tree-nut-free', label: 'Tree Nut-Free' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' }
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' }
];

const DISH_TYPES = {
  breakfast: [
    'drinks',
    'egg',
    'biscuits and cookies',
    'bread',
    'pancake',
    'cereals'
  ],
  lunch: [
    'main course',
    'pasta',
    'egg',
    'salad',
    'soup',
    'sandwiches',
    'pizza',
    'seafood'
  ],
  dinner: [
    'seafood',
    'egg',
    'salad',
    'pizza',
    'pasta',
    'main course'
  ],
  snack: [
    'snacks',
    'drinks',
    'biscuits and cookies',
    'desserts'
  ]
};

interface MealPlanPreferences {
  days: number;
  servings: number;
  healthLabels: string[];
  caloriesPerDay: {
    min: number;
    max: number;
  };
  addedSugar: number;
  selectedMeals: string[];
  mealPreferences: Record<string, {
    enabled: boolean;
    calories: {
      min: number;
      max: number;
    };
    dishTypes: string[];
  }>;
}

const DEFAULT_PREFERENCES: MealPlanPreferences = {
  days: 7,
  servings: 2,
  healthLabels: [],
  caloriesPerDay: {
    min: 1500,
    max: 2500
  },
  addedSugar: 25,
  selectedMeals: ['breakfast', 'lunch', 'dinner'],
  mealPreferences: {
    breakfast: {
      enabled: true,
      calories: {
        min: 300,
        max: 600
      },
      dishTypes: DISH_TYPES.breakfast
    },
    lunch: {
      enabled: true,
      calories: {
        min: 400,
        max: 800
      },
      dishTypes: DISH_TYPES.lunch
    },
    dinner: {
      enabled: true,
      calories: {
        min: 500,
        max: 1000
      },
      dishTypes: DISH_TYPES.dinner
    },
    snack: {
      enabled: false,
      calories: {
        min: 100,
        max: 300
      },
      dishTypes: DISH_TYPES.snack
    }
  }
};

const mealPlanSchema = z.object({
  size: z.number().min(1).max(14),
  plan: z.object({
    accept: z.object({
      all: z.array(z.object({
        health: z.array(z.string()).optional(),
        diet: z.array(z.string()).optional()
      }))
    }),
    fit: z.object({
      ENERC_KCAL: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }),
      'SUGAR.added': z.object({
        max: z.number().optional()
      }).optional()
    }),
    sections: z.record(z.object({
      accept: z.object({
        all: z.array(z.object({
          dish: z.array(z.string()).optional(),
          meal: z.array(z.string()).optional()
        }))
      }),
      fit: z.object({
        ENERC_KCAL: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        })
      })
    }))
  })
});

// Add this constant for valid meal combinations
const VALID_MEAL_COMBINATIONS = [
  {
    id: 'lunch-dinner',
    label: 'Lunch & Dinner',
    meals: ['lunch', 'dinner']
  },
  {
    id: 'full-day',
    label: 'Full Day (Breakfast, Lunch & Dinner)',
    meals: ['breakfast', 'lunch', 'dinner']
  },
  {
    id: 'full-day-snacks',
    label: 'Full Day + Snacks',
    meals: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  {
    id: 'main-meals-snacks',
    label: 'Main Meals + Snacks',
    meals: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'dinner-combo',
    label: 'Breakfast, Dinner & Snacks',
    meals: ['breakfast', 'dinner', 'snack']
  }
];

export default function MealPlanning() {
  const [preferences, setPreferences] = useState<MealPlanPreferences>(DEFAULT_PREFERENCES);
  const [selectedCombination, setSelectedCombination] = useState<string>('full-day');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealPlanResults, setMealPlanResults] = useState<any>(null);

  const updatePreference = <K extends keyof MealPlanPreferences>(
    key: K,
    value: MealPlanPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleHealthLabel = (label: string) => {
    setPreferences(prev => ({
      ...prev,
      healthLabels: prev.healthLabels.includes(label)
        ? prev.healthLabels.filter(l => l !== label)
        : [...prev.healthLabels, label]
    }));
  };

  const selectMealCombination = (combinationId: string) => {
    const combination = VALID_MEAL_COMBINATIONS.find(c => c.id === combinationId);
    if (!combination) return;

    setSelectedCombination(combinationId);

    // Update preferences with the new meal combination
    setPreferences(prev => ({
      ...prev,
      selectedMeals: combination.meals,
      mealPreferences: Object.fromEntries(
        Object.entries(prev.mealPreferences).map(([key, value]) => [
          key,
          {
            ...value,
            enabled: combination.meals.includes(key)
          }
        ])
      )
    }));
  };

  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentCombination = VALID_MEAL_COMBINATIONS.find(c => c.id === selectedCombination);
      if (!currentCombination) {
        throw new Error('Please select a valid meal plan type');
      }

      // Ensure at least one meal type is selected
      const enabledMeals = preferences.selectedMeals
        .filter(meal => preferences.mealPreferences[meal].enabled);

      if (enabledMeals.length === 0) {
        throw new Error('Please select at least one meal type');
      }

      // Create the meal plan request according to the API specification
      const request = {
        size: preferences.days,
        plan: {
          accept: {
            all: [
              {
                health: preferences.healthLabels.map(label => label.toUpperCase().replace(/-/g, '_'))
              }
            ]
          },
          fit: {
            ENERC_KCAL: {
              min: preferences.caloriesPerDay.min,
              max: preferences.caloriesPerDay.max
            },
            'SUGAR.added': {
              max: preferences.addedSugar
            }
          },
          sections: Object.fromEntries(
            enabledMeals.map(meal => {
              const mealTypes = meal === 'dinner'
                ? ['lunch', 'dinner']
                : [meal];

              return [
                meal.charAt(0).toUpperCase() + meal.slice(1),
                {
                  accept: {
                    all: [
                      {
                        dish: preferences.mealPreferences[meal].dishTypes,
                      },
                      {
                        meal: mealTypes
                      }
                    ]
                  },
                  fit: {
                    ENERC_KCAL: {
                      min: preferences.mealPreferences[meal].calories.min,
                      max: preferences.mealPreferences[meal].calories.max
                    }
                  }
                }
              ];
            })
          )
        }
      };

      // Validate the request against our schema
      const validated = mealPlanSchema.parse(request);

      // Generate the meal plan
      const response = await generateMealPlan({
        ...validated,
        plan: {
          ...validated.plan,
          fit: {
            ...validated.plan.fit,
            'SUGAR.added': validated.plan.fit['SUGAR.added'] ? {
              max: validated.plan.fit['SUGAR.added'].max!
            } : undefined
          }
        }
      });

      // Transform the API response into our app's format
      const transformedResults = await Promise.all(response.selection.map(async (day, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);

        // Get only the enabled meal types from the sections
        const mealTypes = Object.keys(day.sections).filter(type =>
          enabledMeals.includes(type.toLowerCase())
        );

        // Fetch recipe details for each meal
        const mealsPromises = mealTypes.map(async (type) => {
          const meal = day.sections[type];
          // Skip if meal is not assigned
          if (!meal || !meal.assigned) {
            return null;
          }

          const recipeId = meal.assigned.split('#')[1];
          let recipeDetails;

          try {
            recipeDetails = await getRecipeDetails(recipeId);
          } catch (error) {
            console.error(`Error fetching recipe details for ${recipeId}:`, error);
            // Use fallback data if recipe details fetch fails
            recipeDetails = {
              label: 'Recipe Unavailable',
              image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
              totalTime: 30,
              yield: preferences.servings,
              calories: preferences.mealPreferences[type.toLowerCase()].calories.max
            };
          }

          return {
            type: type.toLowerCase(),
            recipe: {
              id: recipeId,
              title: recipeDetails.label,
              image: recipeDetails.image,
              time: recipeDetails.totalTime ? `${recipeDetails.totalTime} min` : '30 min',
              servings: recipeDetails.yield || preferences.servings,
              calories: Math.round(recipeDetails.calories / (recipeDetails.yield || 1)),
              rating: 4
            }
          };
        });

        // Filter out null values from meals that weren't assigned
        const meals = (await Promise.all(mealsPromises)).filter(Boolean);

        return {
          date: date.toISOString(),
          meals,
          totalCalories: meals.reduce((sum, meal) => meal ? sum + meal.recipe.calories : sum, 0)
        };
      }));

      setMealPlanResults(transformedResults);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShoppingList = async () => {
    if (!mealPlanResults) return;

    try {
      // Extract all ingredients from the meal plan
      const shoppingItems = [];

      // For each recipe in the meal plan, add its ingredients to the shopping list
      for (const day of mealPlanResults) {
        for (const meal of day.meals) {
          try {
            // Get detailed recipe information including ingredients
            const recipeDetails = await getRecipeDetails(meal.recipe.id);

            // Add each ingredient to the shopping list
            const ingredients = recipeDetails.ingredients.map(ingredient => ({
              id: Math.random().toString(),
              name: ingredient.food,
              quantity: `${ingredient.quantity} ${ingredient.measure}`,
              recipe: meal.recipe.title,
              recipe_id: meal.recipe.id, // Save the recipe ID
              checked: false
            }));

            shoppingItems.push(...ingredients);
          } catch (error) {
            console.error(`Error getting ingredients for ${meal.recipe.title}:`, error);
          }
        }
      }

      // Add all items to the shopping list
      if (shoppingItems.length > 0) {
        await addToShoppingList(shoppingItems);
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error);
    }
  };

  if (mealPlanResults) {
    return (
      <MealPlanResults
        days={mealPlanResults}
        onClose={() => setMealPlanResults(null)}
        onAddToShoppingList={handleAddToShoppingList}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.header}
      >
        <Text style={styles.title}>Meal Planning</Text>
      </Animated.View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Duration</Text>
          <View style={styles.durationContainer}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => updatePreference('days', Math.max(1, preferences.days - 1))}
            >
              <Minus size={20} color="#2A9D8F" />
            </TouchableOpacity>
            <View style={styles.durationDisplay}>
              <Text style={styles.durationNumber}>{preferences.days}</Text>
              <Text style={styles.durationLabel}>days</Text>
            </View>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => updatePreference('days', Math.min(14, preferences.days + 1))}
            >
              <Plus size={20} color="#2A9D8F" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servings</Text>
          <View style={styles.servingsContainer}>
            <TouchableOpacity
              style={styles.servingsButton}
              onPress={() => updatePreference('servings', Math.max(1, preferences.servings - 1))}
            >
              <Minus size={20} color="#2A9D8F" />
            </TouchableOpacity>
            <View style={styles.servingsDisplay}>
              <Text style={styles.servingsNumber}>{preferences.servings}</Text>
              <Text style={styles.servingsLabel}>servings</Text>
            </View>
            <TouchableOpacity
              style={styles.servingsButton}
              onPress={() => updatePreference('servings', Math.min(12, preferences.servings + 1))}
            >
              <Plus size={20} color="#2A9D8F" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.healthLabelsContainer}
          >
            {HEALTH_LABELS.map(label => (
              <TouchableOpacity
                key={label.id}
                style={[
                  styles.healthLabel,
                  preferences.healthLabels.includes(label.id) && styles.healthLabelSelected
                ]}
                onPress={() => toggleHealthLabel(label.id)}
              >
                <Text style={[
                  styles.healthLabelText,
                  preferences.healthLabels.includes(label.id) && styles.healthLabelTextSelected
                ]}>
                  {label.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Calories</Text>
          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesInput}>
              <Text style={styles.caloriesLabel}>Min</Text>
              <TextInput
                style={styles.caloriesTextInput}
                value={preferences.caloriesPerDay.min.toString()}
                onChangeText={(value) => {
                  const num = parseInt(value) || 0;
                  updatePreference('caloriesPerDay', {
                    ...preferences.caloriesPerDay,
                    min: num
                  });
                }}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.caloriesSeparator} />
            <View style={styles.caloriesInput}>
              <Text style={styles.caloriesLabel}>Max</Text>
              <TextInput
                style={styles.caloriesTextInput}
                value={preferences.caloriesPerDay.max.toString()}
                onChangeText={(value) => {
                  const num = parseInt(value) || 0;
                  updatePreference('caloriesPerDay', {
                    ...preferences.caloriesPerDay,
                    max: num
                  });
                }}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Added Sugar Limit</Text>
          <View style={styles.sugarContainer}>
            <TextInput
              style={styles.sugarInput}
              value={preferences.addedSugar.toString()}
              onChangeText={(value) => {
                const num = parseInt(value) || 0;
                updatePreference('addedSugar', num);
              }}
              keyboardType="number-pad"
            />
            <Text style={styles.sugarUnit}>g per day</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Plan Type</Text>
          <View style={styles.mealCombinationsContainer}>
            {VALID_MEAL_COMBINATIONS.map(combination => (
              <TouchableOpacity
                key={combination.id}
                style={[
                  styles.combinationCard,
                  selectedCombination === combination.id && styles.combinationCardSelected
                ]}
                onPress={() => selectMealCombination(combination.id)}
              >
                <Text style={[
                  styles.combinationLabel,
                  selectedCombination === combination.id && styles.combinationLabelSelected
                ]}>
                  {combination.label}
                </Text>
                <Text style={[
                  styles.combinationDetails,
                  selectedCombination === combination.id && styles.combinationDetailsSelected
                ]}>
                  {combination.meals.map(meal =>
                    preferences.mealPreferences[meal].calories.min + '-' +
                    preferences.mealPreferences[meal].calories.max + ' cal'
                  ).join(' • ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGeneratePlan}
          disabled={loading}
        >
          <Text style={styles.generateButtonText}>
            {loading ? 'Generating...' : 'Generate Meal Plan'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  durationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationDisplay: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  durationNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  durationLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  servingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsDisplay: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  servingsNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  servingsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  healthLabelsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  healthLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  healthLabelSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  healthLabelText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  healthLabelTextSelected: {
    color: '#fff',
  },
  caloriesContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  caloriesInput: {
    flex: 1,
  },
  caloriesLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  caloriesTextInput: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#264653',
    padding: 0,
  },
  caloriesSeparator: {
    width: 1,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
  },
  sugarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sugarInput: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#264653',
    padding: 0,
    minWidth: 80,
  },
  sugarUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  mealCombinationsContainer: {
    gap: 12,
  },
  combinationCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  combinationCardSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  combinationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  combinationLabelSelected: {
    color: '#1976d2',
  },
  combinationDetails: {
    fontSize: 12,
    color: '#666',
  },
  combinationDetailsSelected: {
    color: '#1976d2',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  generateButton: {
    backgroundColor: '#2A9D8F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    margin: 24,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#DC2626',
  },
});





