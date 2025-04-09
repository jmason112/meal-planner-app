import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ChevronRight, Clock, Users, SlidersHorizontal, X as XIcon, Star, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Recipe, RecipeSearchParams, searchRecipes } from '@/lib/edamam';

const CATEGORIES = [
  { id: 'quick', name: 'Quick & Easy', color: '#2A9D8F', image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800&auto=format&fit=crop' },
  { id: 'healthy', name: 'Healthy', color: '#E9C46A', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop' },
  { id: 'desserts', name: 'Desserts', color: '#E76F51', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop' },
  { id: 'vegetarian', name: 'Vegetarian', color: '#2A9D8F', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop' },
];

// Sample data for categories only
// Trending and recommended recipes are now fetched from the API

const DIETARY_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Keto', 'Paleo'
];

const CUISINE_TYPES = [
  'Italian', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 'American', 'French'
];

const PREP_TIMES = [
  { label: 'Under 30 mins', value: '0-30' },
  { label: '30-60 mins', value: '30-60' },
  { label: 'Over 60 mins', value: '60+' }
];

const DIFFICULTY_LEVELS = [
  'Easy', 'Intermediate', 'Advanced'
];

const MAIN_INGREDIENTS = [
  'Chicken', 'Beef', 'Fish', 'Vegetables', 'Pasta', 'Rice', 'Eggs'
];

const CALORIE_RANGES = [
  { label: 'Under 300', value: '0-300' },
  { label: '300-500', value: '300-500' },
  { label: '500-800', value: '500-800' },
  { label: 'Over 800', value: '800+' }
];

interface FilterState {
  dietary: string[];
  cuisine: string[];
  prepTime: string;
  difficulty: string;
  ingredients: string[];
  calories: string;
  rating: number | null;
}

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.filterSection}>
    <Text style={styles.filterSectionTitle}>{title}</Text>
    {children}
  </View>
);

const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipSelected]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const FilterDrawer = ({ onClose, filters, setFilters, onApply }: {
  onClose: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onApply?: () => void;
}) => {
  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters({
      ...filters,
      [type]: Array.isArray(filters[type])
        ? (filters[type] as string[]).includes(value)
          ? (filters[type] as string[]).filter(item => item !== value)
          : [...(filters[type] as string[]), value]
        : value
    });
  };

  const setRating = (rating: number) => {
    setFilters({
      ...filters,
      rating: filters.rating === rating ? null : rating
    });
  };

  return (
    <Animated.View
      entering={FadeInRight}
      style={styles.filterDrawer}
    >
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <XIcon size={24} color="#264653" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
        <FilterSection title="Dietary Restrictions">
          <View style={styles.chipContainer}>
            {DIETARY_RESTRICTIONS.map(diet => (
              <FilterChip
                key={diet}
                label={diet}
                selected={filters.dietary.includes(diet)}
                onPress={() => toggleFilter('dietary', diet)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Cuisine Type">
          <View style={styles.chipContainer}>
            {CUISINE_TYPES.map(cuisine => (
              <FilterChip
                key={cuisine}
                label={cuisine}
                selected={filters.cuisine.includes(cuisine)}
                onPress={() => toggleFilter('cuisine', cuisine)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Preparation Time">
          <View style={styles.chipContainer}>
            {PREP_TIMES.map(time => (
              <FilterChip
                key={time.value}
                label={time.label}
                selected={filters.prepTime === time.value}
                onPress={() => toggleFilter('prepTime', time.value)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Difficulty Level">
          <View style={styles.chipContainer}>
            {DIFFICULTY_LEVELS.map(level => (
              <FilterChip
                key={level}
                label={level}
                selected={filters.difficulty === level}
                onPress={() => toggleFilter('difficulty', level)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Main Ingredients">
          <View style={styles.chipContainer}>
            {MAIN_INGREDIENTS.map(ingredient => (
              <FilterChip
                key={ingredient}
                label={ingredient}
                selected={filters.ingredients.includes(ingredient)}
                onPress={() => toggleFilter('ingredients', ingredient)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Calories per Serving">
          <View style={styles.chipContainer}>
            {CALORIE_RANGES.map(range => (
              <FilterChip
                key={range.value}
                label={range.label}
                selected={filters.calories === range.value}
                onPress={() => toggleFilter('calories', range.value)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Rating">
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(rating => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingButton}
                onPress={() => setRating(rating)}
              >
                <Star
                  size={24}
                  color={filters.rating && filters.rating >= rating ? '#FFB800' : '#DDD'}
                  fill={filters.rating && filters.rating >= rating ? '#FFB800' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </FilterSection>
      </ScrollView>

      <View style={styles.filterActions}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setFilters({
            dietary: [],
            cuisine: [],
            prepTime: '',
            difficulty: '',
            ingredients: [],
            calories: '',
            rating: null
          })}
        >
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => {
            if (onApply) onApply();
            else onClose();
          }}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function RecipeIndex() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dietary: [],
    cuisine: [],
    prepTime: '',
    difficulty: '',
    ingredients: [],
    calories: '',
    rating: null
  });

  // Add state for API data
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchParams, setSearchParams] = useState<RecipeSearchParams>({});

  // Fetch trending and recommended recipes on component mount
  useEffect(() => {
    fetchTrendingRecipes();
    fetchRecommendedRecipes();
  }, []);

  const fetchTrendingRecipes = async () => {
    try {
      setLoadingTrending(true);
      const response = await searchRecipes({
        random: true,
        mealType: ['Dinner'],
        from: 0,
        to: 6
      });
      setTrendingRecipes(response.hits.map(hit => hit.recipe));
    } catch (err) {
      console.error('Error fetching trending recipes:', err);
      setError('Failed to load trending recipes');
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchRecommendedRecipes = async () => {
    try {
      setLoadingRecommended(true);
      const response = await searchRecipes({
        random: true,
        diet: ['balanced'],
        from: 0,
        to: 6
      });
      setRecommendedRecipes(response.hits.map(hit => hit.recipe));
    } catch (err) {
      console.error('Error fetching recommended recipes:', err);
      setError('Failed to load recommended recipes');
    } finally {
      setLoadingRecommended(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoadingSearch(true);
      setShowSearchResults(true);

      // Create a copy of the current search params
      const params = { ...searchParams };

      // Add the search query if provided
      if (searchQuery.trim()) {
        params.query = searchQuery.trim();
      }

      // Add dietary restrictions from filters
      if (filters.dietary.length > 0) {
        params.health = filters.dietary.map(diet => {
          // Convert UI-friendly names to API parameter values
          switch (diet) {
            case 'Vegetarian': return 'vegetarian';
            case 'Vegan': return 'vegan';
            case 'Gluten-free': return 'gluten-free';
            case 'Dairy-free': return 'dairy-free';
            case 'Keto': return 'keto-friendly';
            case 'Paleo': return 'paleo';
            default: return diet.toLowerCase();
          }
        });
      }

      // Add cuisine type from filters
      if (filters.cuisine.length > 0) {
        params.cuisineType = filters.cuisine;
      }

      // Add prep time from filters
      if (filters.prepTime) {
        params.time = filters.prepTime;
      }

      // Add calories from filters
      if (filters.calories) {
        params.calories = filters.calories;
      }

      // Add excluded ingredients from filters
      if (filters.ingredients.length > 0) {
        params.excluded = filters.ingredients;
      }

      // Update the search params state
      setSearchParams(params);

      // Make the API request
      const response = await searchRecipes(params);
      setSearchResults(response.hits.map(hit => hit.recipe));
    } catch (err) {
      console.error('Error searching recipes:', err);
      setError('Failed to search recipes');
    } finally {
      setLoadingSearch(false);
    }
  };

  const navigateToRecipe = (recipeUri: string) => {
    // Extract the recipe ID from the URI
    const id = recipeUri.split('#recipe_')[1];
    router.push(`/recipe/${id}`);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Apply filters from the filter modal
  const handleApplyFilters = () => {
    toggleFilters();
    handleSearch();
  };

  const handleBackToMain = () => {
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchParams({});
    setSearchResults([]);
  };

  // This function is used in the filter modal

  return (
    <View style={styles.container}>
      <View style={[styles.mainContent, showFilters && styles.blurred]}>
        <ScrollView
          style={styles.mainContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!showFilters}
        >
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.header}
          >
            <Text style={styles.title}>Recipes</Text>
            <View style={styles.searchContainer}>
              <Search size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.filterButton}
                onPress={toggleFilters}
              >
                <SlidersHorizontal size={20} color="#2A9D8F" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {showSearchResults ? (
            <View style={styles.searchResultsContainer}>
              {loadingSearch ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2A9D8F" />
                  <Text style={styles.loadingText}>Searching recipes...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <View style={styles.errorButtonsContainer}>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleSearch}
                    >
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.backToMainButton}
                      onPress={handleBackToMain}
                    >
                      <ArrowLeft size={20} color="#fff" />
                      <Text style={styles.backToMainButtonText}>Back to Main</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No recipes found</Text>
                  <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
                  <TouchableOpacity
                    style={styles.backToMainButton}
                    onPress={handleBackToMain}
                  >
                    <ArrowLeft size={20} color="#fff" />
                    <Text style={styles.backToMainButtonText}>Back to Main</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.searchResultsScroll}>
                  <View style={styles.searchResultsHeader}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackToMain}
                    >
                      <ArrowLeft size={24} color="#264653" />
                    </TouchableOpacity>
                    <Text style={styles.searchResultsTitle}>
                      {searchQuery ? `Results for "${searchQuery}"` : 'Search Results'}
                    </Text>
                  </View>
                  <View style={styles.searchResultsGrid}>
                    {searchResults.map((recipe, index) => (
                      <Animated.View
                        key={recipe.uri}
                        entering={FadeInDown.delay(index * 100)}
                        style={styles.searchResultCard}
                      >
                        <TouchableOpacity
                          style={styles.searchResultCardContent}
                          onPress={() => navigateToRecipe(recipe.uri)}
                        >
                          <Image
                            source={{ uri: recipe.image }}
                            style={styles.searchResultImage}
                          />
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultTitle} numberOfLines={2}>
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
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.content}>
              <Animated.View entering={FadeInDown.delay(400)}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoriesContainer}
                >
                  {CATEGORIES.map((category, index) => (
                    <Animated.View
                      key={category.id}
                      entering={FadeInRight.delay(500 + index * 100)}
                    >
                      <TouchableOpacity
                        style={styles.categoryCard}
                        onPress={() => {
                          // Set search params based on category
                          let params: RecipeSearchParams = {};
                          if (category.id === 'quick') {
                            params = { time: '0-30' };
                          } else if (category.id === 'healthy') {
                            params = { diet: ['balanced'] };
                          } else if (category.id === 'desserts') {
                            params = { dishType: ['Desserts'] };
                          } else if (category.id === 'vegetarian') {
                            params = { health: ['vegetarian'] };
                          }
                          // Update search params and trigger search
                          setSearchParams(params);
                          setShowSearchResults(true);
                        }}
                      >
                        <Image
                          source={{ uri: category.image }}
                          style={styles.categoryImage}
                        />
                        <View style={[styles.categoryOverlay, { backgroundColor: category.color + '80' }]} />
                        <Text style={styles.categoryName}>{category.name}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </ScrollView>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(600)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending Now</Text>
                  <TouchableOpacity style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>See All</Text>
                    <ChevronRight size={16} color="#2A9D8F" />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.recipesContainer}
                >
                  {loadingTrending ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#2A9D8F" />
                      <Text style={styles.loadingText}>Loading trending recipes...</Text>
                    </View>
                  ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : (
                    trendingRecipes.map((recipe, index) => (
                      <Animated.View
                        key={recipe.uri}
                        entering={FadeInRight.delay(700 + index * 100)}
                      >
                        <TouchableOpacity
                          style={styles.recipeCard}
                          onPress={() => navigateToRecipe(recipe.uri)}
                        >
                          <Image
                            source={{ uri: recipe.image }}
                            style={styles.recipeImage}
                          />
                          <View style={styles.recipeContent}>
                            <Text style={styles.recipeName}>{recipe.label}</Text>
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
                                  <Text style={styles.recipeMetaText}>{Math.round(recipe.yield)} servings</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))
                  )}
                </ScrollView>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recommended</Text>
                  <TouchableOpacity style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>See All</Text>
                    <ChevronRight size={16} color="#2A9D8F" />
                  </TouchableOpacity>
                </View>
                <View style={styles.recommendedContainer}>
                  {loadingRecommended ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#2A9D8F" />
                      <Text style={styles.loadingText}>Loading recommended recipes...</Text>
                    </View>
                  ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : (
                    recommendedRecipes.map((recipe, index) => (
                      <Animated.View
                        key={recipe.uri}
                        entering={FadeInDown.delay(900 + index * 100)}
                        style={styles.recommendedCardContainer}
                      >
                        <TouchableOpacity
                          style={styles.recommendedCard}
                          onPress={() => navigateToRecipe(recipe.uri)}
                        >
                          <Image
                            source={{ uri: recipe.image }}
                            style={styles.recommendedImage}
                          />
                          <View style={styles.recommendedContent}>
                            <Text style={styles.recommendedName}>{recipe.label}</Text>
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
                                  <Text style={styles.recipeMetaText}>{Math.round(recipe.yield)} servings</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))
                  )}
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      </View>

      {showFilters && (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={toggleFilters}
          />
          <FilterDrawer
            onClose={toggleFilters}
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
          />
        </>
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#E76F51',
    textAlign: 'center',
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToMainButton: {
    flexDirection: 'row',
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backToMainButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsScroll: {
    flex: 1,
    padding: 16,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    flex: 1,
  },
  searchResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  searchResultCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
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
  searchResultCardContent: {
    width: '100%',
  },
  searchResultImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  searchResultInfo: {
    padding: 12,
  },
  searchResultTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginBottom: 8,
  },
  mainContent: {
    flex: 1,
  },
  blurred: {
    opacity: 0.7,
  },
  mainContainer: {
    flex: 1,
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
    fontSize: 28,
    color: '#264653',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  content: {
    padding: 24,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#2A9D8F',
    marginRight: 4,
  },
  categoriesContainer: {
    marginBottom: 32,
  },
  categoryCard: {
    width: 140,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  recipesContainer: {
    marginBottom: 32,
  },
  recipeCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recipeImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  recipeContent: {
    padding: 12,
  },
  recipeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginBottom: 8,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recommendedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recommendedCardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  recommendedCard: {
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
  },
  recommendedImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  recommendedContent: {
    padding: 12,
  },
  recommendedName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#264653',
    marginBottom: 8,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterDrawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  closeButton: {
    padding: 8,
  },
  filterContent: {
    flex: 1,
  },
  filterSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterSectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#264653',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterChipSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  filterChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    padding: 4,
  },
  filterActions: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#666',
  },
  applyButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2A9D8F',
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#fff',
  },
});


