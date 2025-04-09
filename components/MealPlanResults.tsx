import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Users, ChevronRight, ShoppingBag, Star, ArrowLeft, Save } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SaveMealPlanModal } from './SaveMealPlanModal';
import { InstacartModal } from './InstacartModal';
import { createShoppingList, ShoppingListEntry } from '@/lib/edamam';

interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  servings: number;
  calories: number;
  rating: number;
}

interface MealPlanDay {
  date: string;
  meals: {
    type: string;
    recipe: Recipe;
  }[];
  totalCalories: number;
}

interface MealPlanResultsProps {
  days: MealPlanDay[];
  onClose: () => void;
  onAddToShoppingList: () => void;
}

export function MealPlanResults({ days, onClose, onAddToShoppingList }: MealPlanResultsProps) {
  const router = useRouter();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showInstacartModal, setShowInstacartModal] = useState(false);
  const [isCreatingShoppingList, setIsCreatingShoppingList] = useState(false);

  const navigateToRecipe = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={12}
        color={index < rating ? '#FFB800' : '#DDD'}
        fill={index < rating ? '#FFB800' : 'transparent'}
      />
    ));
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handleSaveComplete = () => {
    setShowSaveModal(false);
    // Optionally show a success message or navigate somewhere
  };

  const handleAddToInstacart = () => {
    setShowInstacartModal(true);
  };

  const createInstacartList = async (): Promise<string | undefined> => {
    try {
      setIsCreatingShoppingList(true);

      // Create entries for the shopping list API
      const entries: ShoppingListEntry[] = days.flatMap(day =>
        day.meals.map(meal => ({
          quantity: meal.recipe.servings,
          measure: 'http://www.edamam.com/ontologies/edamam.owl#Measure_serving',
          recipe: `http://www.edamam.com/ontologies/edamam.owl#recipe_${meal.recipe.id.replace('recipe_', '')}`
        }))
      );

      // Call the API to create a shopping list
      const response = await createShoppingList(entries);

      // Log the full response to see what we're getting back
      console.log('Edamam shopping list response:', JSON.stringify(response, null, 2));

      // The shopping cart URL should now be consistently available in response.shoppingCartUrl
      // thanks to our fix in the createShoppingList function
      const cartUrl = response.shoppingCartUrl;

      if (!cartUrl) {
        console.warn('No shopping cart URL found in the response');
      } else {
        console.log('Found Instacart URL:', cartUrl);
      }

      // Also add to local shopping list for reference
      try {
        console.log('Adding items to local shopping list from MealPlanResults');
        onAddToShoppingList();
        console.log('Successfully added items to local shopping list from MealPlanResults');
      } catch (error) {
        console.error('Error adding items to local shopping list from MealPlanResults:', error);
      }

      return cartUrl;
    } catch (error) {
      console.error('Error creating Instacart shopping list:', error);
      throw error;
    } finally {
      setIsCreatingShoppingList(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <ArrowLeft size={24} color="#264653" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Meal Plan</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSave}
          >
            <Save size={24} color="#2A9D8F" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAddToInstacart}
          >
            <ShoppingBag size={24} color="#2A9D8F" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {days.map((day, dayIndex) => (
          <Animated.View
            key={day.date}
            entering={FadeInDown.delay(300 + dayIndex * 100)}
            style={styles.dayContainer}
          >
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{formatDate(day.date)}</Text>
              <Text style={styles.calories}>{Math.round(day.totalCalories)} cal</Text>
            </View>

            {day.meals.map((meal) => (
              <TouchableOpacity
                key={`${day.date}-${meal.type}`}
                style={styles.mealCard}
                onPress={() => navigateToRecipe(meal.recipe.id)}
              >
                <Image
                  source={{ uri: meal.recipe.image }}
                  style={styles.mealImage}
                />
                <View style={styles.mealContent}>
                  <View style={styles.mealTypeContainer}>
                    <Text style={styles.mealType}>
                      {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.mealTitle}>{meal.recipe.title}</Text>

                  <View style={styles.mealMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color="#666" />
                      <Text style={styles.metaText}>{meal.recipe.time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={14} color="#666" />
                      <Text style={styles.metaText}>{meal.recipe.servings} servings</Text>
                    </View>
                  </View>

                  <View style={styles.mealFooter}>
                    <View style={styles.rating}>
                      {renderStars(meal.recipe.rating)}
                    </View>
                    <Text style={styles.calories}>{Math.round(meal.recipe.calories)} cal</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#666" style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(800)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToInstacart}
        >
          <Text style={styles.addButtonText}>Order from Instacart</Text>
          <ShoppingBag size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {showSaveModal && (
        <SaveMealPlanModal
          recipes={days.flatMap((day, dayIndex) =>
            day.meals.map(meal => ({
              recipe_id: meal.recipe.id,
              recipe_data: meal.recipe,
              day_index: dayIndex,
              meal_type: meal.type
            }))
          )}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveComplete}
        />
      )}

      <InstacartModal
        visible={showInstacartModal}
        onClose={() => setShowInstacartModal(false)}
        onConfirm={createInstacartList}
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
  closeButton: {
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
  content: {
    flex: 1,
  },
  dayContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
  },
  mealCard: {
    flexDirection: 'row',
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
  mealImage: {
    width: 100,
    height: '100%',
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
    marginBottom: 8,
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
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
  calories: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
  },
  chevron: {
    alignSelf: 'center',
    marginRight: 12,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  addButton: {
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});