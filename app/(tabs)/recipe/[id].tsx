import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Users, Plus, Check, CircleAlert as AlertCircle, Calendar, ExternalLink } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { addToShoppingList } from '@/lib/shopping';
import { ShoppingListToast } from '@/components/ShoppingListToast';
import { getRecipeDetails, type Recipe } from '@/lib/edamam';
import { MealPlanSelectorModal } from '@/components/MealPlanSelectorModal';

export default function RecipeDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, boolean>>({});
  const [showToast, setShowToast] = useState(false);
  const [showMealPlanSelector, setShowMealPlanSelector] = useState(false);

  useEffect(() => {
    loadRecipeDetails();
  }, [id]);

  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const recipeData = await getRecipeDetails(id as string);
      setRecipe(recipeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  const openLink = async (url: string) => {
    try {
      // Open the URL in an in-app browser
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening link:', error);

      // Fallback to external browser if in-app browser fails
      try {
        await Linking.openURL(url);
      } catch (linkError) {
        console.error('Error opening external link:', linkError);
      }
    }
  };

  const addToList = async () => {
    if (!recipe) return;

    // If no ingredients are selected, select all of them
    if (Object.keys(selectedIngredients).length === 0 ||
        !Object.values(selectedIngredients).some(selected => selected)) {
      const allSelected = recipe.ingredientLines.reduce((acc, ingredient) => {
        acc[ingredient] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedIngredients(allSelected);

      const allItems = recipe.ingredientLines.map(ingredient => ({
        id: Math.random().toString(),
        name: ingredient.split(',')[0], // Get the main ingredient name
        quantity: ingredient.split(',')[1]?.trim() || '', // Get the quantity if available
        recipe: recipe.label,
        recipe_id: id as string, // Save the recipe ID
        checked: false
      }));

      try {
        await addToShoppingList(allItems);
        setShowToast(true);
        // Don't navigate away immediately
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
      } catch (error) {
        console.error('Error adding to shopping list:', error);
        setError('Failed to add items to shopping list');
      }

      return;
    }

    // If some ingredients are selected, add only those
    const selectedItems = Object.entries(selectedIngredients)
      .filter(([_, selected]) => selected)
      .map(([ingredient]) => ({
        id: Math.random().toString(),
        name: ingredient.split(',')[0], // Get the main ingredient name
        quantity: ingredient.split(',')[1]?.trim() || '', // Get the quantity if available
        recipe: recipe.label,
        recipe_id: id as string, // Save the recipe ID
        checked: false
      }));

    try {
      await addToShoppingList(selectedItems);
      setShowToast(true);
      // Don't navigate away immediately
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      setError('Failed to add items to shopping list');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#E76F51" />
        <Text style={styles.errorTitle}>Failed to load recipe</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#264653" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.image}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#264653" />
          </TouchableOpacity>
        </View>

        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.content}
        >
          <Text style={styles.title}>{recipe.label}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Clock size={20} color="#2A9D8F" />
              <Text style={styles.metaText}>
                {recipe.totalTime ? `${recipe.totalTime} min` : 'Time not available'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={20} color="#2A9D8F" />
              <Text style={styles.metaText}>{recipe.yield} servings</Text>
            </View>
          </View>

          {recipe.dietLabels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Diet</Text>
              <View style={styles.tagContainer}>
                {recipe.dietLabels.map((label, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {recipe.healthLabels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Health Labels</Text>
              <View style={styles.tagContainer}>
                {recipe.healthLabels.map((label, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredientLines.map((ingredient, index) => (
              <TouchableOpacity
                key={index}
                style={styles.ingredientItem}
                onPress={() => toggleIngredient(ingredient)}
              >
                <View style={[
                  styles.checkbox,
                  selectedIngredients[ingredient] && styles.checkboxSelected
                ]}>
                  {selectedIngredients[ingredient] ? (
                    <Check size={16} color="#fff" />
                  ) : (
                    <Plus size={16} color="#2A9D8F" />
                  )}
                </View>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {recipe.url && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Source</Text>
              <TouchableOpacity
                style={styles.sourceLink}
                onPress={() => openLink(recipe.url)}
              >
                <View style={styles.sourceLinkContent}>
                  <Text style={styles.sourceLinkText}>{recipe.source}</Text>
                  <ExternalLink size={16} color="#2A9D8F" style={styles.externalLinkIcon} />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(400)}
        style={styles.footer}
      >
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.mealPlanButton}
            onPress={() => setShowMealPlanSelector(true)}
          >
            <Calendar size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add to Meal Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addToList}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add to Shopping List</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ShoppingListToast
        visible={showToast}
        onHide={() => setShowToast(false)}
      />

      {showMealPlanSelector && recipe && (
        <MealPlanSelectorModal
          onClose={() => setShowMealPlanSelector(false)}
          recipeId={id as string}
          recipeData={{
            id: id as string,
            title: recipe.label,
            image: recipe.image,
            time: recipe.totalTime ? `${recipe.totalTime} min` : 'N/A',
            servings: recipe.yield || 2,
            calories: Math.round(recipe.calories / (recipe.yield || 1)),
            rating: 4
          }}
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
    backgroundColor: '#F8F9FA',
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
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 28,
    color: '#264653',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A9D8F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  ingredientText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    flex: 1,
  },
  sourceLink: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sourceLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#2A9D8F',
  },
  externalLinkIcon: {
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mealPlanButton: {
    flex: 1,
    backgroundColor: '#264653',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#2A9D8F',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});