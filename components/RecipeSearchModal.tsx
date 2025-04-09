import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { X as XIcon, Search, Clock, Users, Plus, Check } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { searchRecipes, Recipe } from '@/lib/edamam';

interface RecipeSearchModalProps {
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe, mealType: string, dayIndices: number[]) => void;
  initialMealType?: string;
  initialDayIndex?: number;
  maxDays?: number;
  mealPlanId?: string;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' }
];

export function RecipeSearchModal({
  onClose,
  onSelectRecipe,
  initialMealType = 'dinner',
  initialDayIndex = 0,
  maxDays = 7,
  mealPlanId
}: RecipeSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState(initialMealType);
  const [selectedDays, setSelectedDays] = useState<number[]>([initialDayIndex]);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [showDaySelector, setShowDaySelector] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await searchRecipes({
        query: searchQuery,
        mealType: [selectedMealType],
        from: 0,
        to: 20
      });

      if (response && response.hits) {
        setRecipes(response.hits.map(hit => hit.recipe));
      } else {
        setError('No recipes found. Please try a different search term.');
      }
    } catch (err) {
      console.error('Error searching recipes:', err);
      setError(err instanceof Error ? err.message : 'Failed to search recipes');
    } finally {
      setLoading(false);
    }
  };

  // Load some initial recipes when the modal opens
  useEffect(() => {
    const loadInitialRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await searchRecipes({
          mealType: [selectedMealType],
          random: true,
          from: 0,
          to: 10
        });

        if (response && response.hits) {
          setRecipes(response.hits.map(hit => hit.recipe));
        }
      } catch (err) {
        console.error('Error loading initial recipes:', err);
        // Don't show error for initial load
      } finally {
        setLoading(false);
      }
    };

    loadInitialRecipes();
  }, [selectedMealType]);

  const toggleDaySelection = (dayIndex: number) => {
    setSelectedDays(prev => {
      // If day is already selected, remove it
      if (prev.includes(dayIndex)) {
        // Don't allow removing the last day
        if (prev.length === 1) return prev;
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

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe.uri);
    setShowDaySelector(true);
  };

  const confirmRecipeSelection = () => {
    if (!selectedRecipe) return;
    const recipe = recipes.find(r => r.uri === selectedRecipe);
    if (recipe) {
      onSelectRecipe(recipe, selectedMealType, selectedDays);
    }
  };

  return (
    <View style={styles.overlay}>
      {showDaySelector && selectedRecipe ? (
        <Animated.View
          entering={FadeIn}
          style={styles.daySelectorModal}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Select Days</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDaySelector(false)}
            >
              <XIcon size={24} color="#264653" />
            </TouchableOpacity>
          </View>

          <View style={styles.daySelectorContent}>
            <Text style={styles.daySelectorText}>
              Select which days to add this recipe to in your meal plan:
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
                {MEAL_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.mealTypeOption,
                      type.id === selectedMealType && styles.mealTypeOptionSelected
                    ]}
                    onPress={() => setSelectedMealType(type.id)}
                  >
                    <Text
                      style={[
                        styles.mealTypeOptionText,
                        type.id === selectedMealType && styles.mealTypeOptionTextSelected
                      ]}
                    >
                      {type.label}
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
              onPress={confirmRecipeSelection}
            >
              <Text style={styles.addButtonText}>
                Add to {selectedDays.length === 1 ? `Day ${selectedDays[0] + 1}` : `${selectedDays.length} Days`}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn}
          style={styles.modal}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Add Recipe</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <XIcon size={24} color="#264653" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search recipes..."
              placeholderTextColor="#666"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mealTypeContainer}>
          <Text style={styles.sectionLabel}>Meal Type:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mealTypeScroll}
          >
            {MEAL_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.mealTypeChip,
                  selectedMealType === type.id && styles.mealTypeChipSelected
                ]}
                onPress={() => setSelectedMealType(type.id)}
              >
                <Text style={[
                  styles.mealTypeChipText,
                  selectedMealType === type.id && styles.mealTypeChipTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
              <Text style={styles.loadingText}>Searching recipes...</Text>
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              {searchQuery.trim() ? (
                <>
                  <Text style={styles.emptyTitle}>No recipes found</Text>
                  <Text style={styles.emptyText}>Try a different search term or meal type.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>Loading recipes...</Text>
                  <Text style={styles.emptyText}>Or search for specific recipes to add to your meal plan.</Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.recipesContainer}>
              {recipes.map(recipe => (
                <TouchableOpacity
                  key={recipe.uri}
                  style={[
                    styles.recipeCard,
                    selectedRecipe === recipe.uri && styles.recipeCardSelected
                  ]}
                  onPress={() => handleSelectRecipe(recipe)}
                >
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.recipeImage}
                  />
                  <View style={styles.recipeContent}>
                    <Text style={styles.recipeTitle} numberOfLines={2}>
                      {recipe.label}
                    </Text>
                    <View style={styles.recipeMetaContainer}>
                      <View style={styles.recipeMeta}>
                        <Clock size={14} color="#666" />
                        <Text style={styles.recipeMetaText}>
                          {recipe.totalTime > 0 ? `${recipe.totalTime} min` : 'N/A'}
                        </Text>
                      </View>
                      {recipe.yield > 0 && (
                        <View style={styles.recipeMeta}>
                          <Users size={14} color="#666" />
                          <Text style={styles.recipeMetaText}>
                            {Math.round(recipe.yield)} servings
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.selectIconContainer}>
                    {selectedRecipe === recipe.uri ? (
                      <Check size={24} color="#2A9D8F" />
                    ) : (
                      <Plus size={24} color="#666" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
      )}
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
    maxWidth: 800,
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    padding: 12,
  },
  searchButton: {
    backgroundColor: '#2A9D8F',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  mealTypeContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#264653',
    marginBottom: 8,
  },
  mealTypeScroll: {
    flexDirection: 'row',
  },
  mealTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  mealTypeChipSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  mealTypeChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  mealTypeChipTextSelected: {
    color: '#fff',
  },
  dayContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  daySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonDisabled: {
    opacity: 0.5,
  },
  dayButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
  },
  dayText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 8,
    textAlign: 'center',
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
  recipesContainer: {
    gap: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 16,
  },
  recipeCardSelected: {
    borderColor: '#2A9D8F',
    borderWidth: 2,
  },
  recipeImage: {
    width: 120,
    height: 120,
  },
  recipeContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  recipeTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 8,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  selectIconContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
