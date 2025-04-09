import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Recipe, RecipeSearchParams, RecipeSearchResponse, searchRecipes } from '@/lib/edamam';

interface RecipeSearchResultsProps {
  searchParams: RecipeSearchParams;
  onLoadMore?: () => void;
}

export function RecipeSearchResults({ searchParams }: RecipeSearchResultsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Reset state when search params change
    setRecipes([]);
    setNextPageUrl(null);
    setCurrentPage(0);
    setError(null);
    setLoading(true);
    
    fetchRecipes();
  }, [searchParams]);

  const fetchRecipes = async (loadMore = false) => {
    try {
      if (loadMore && !nextPageUrl) return;
      
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Calculate pagination
      const from = loadMore ? currentPage * 20 : 0;
      const to = from + 20;
      
      // Fetch recipes
      const response = await searchRecipes({
        ...searchParams,
        from,
        to
      });
      
      // Update state
      if (loadMore) {
        setRecipes(prev => [...prev, ...response.hits.map(hit => hit.recipe)]);
      } else {
        setRecipes(response.hits.map(hit => hit.recipe));
      }
      
      // Store next page URL if available
      setNextPageUrl(response._links.next?.href || null);
      setCurrentPage(prev => loadMore ? prev + 1 : 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && nextPageUrl) {
      fetchRecipes(true);
    }
  };

  const handleRecipePress = (recipeId: string) => {
    // Extract the recipe ID from the URI
    const id = recipeId.split('#recipe_')[1];
    router.push(`/recipe/${id}`);
  };

  if (loading && !loadingMore) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Finding delicious recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#E76F51" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchRecipes()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No recipes found</Text>
        <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recipes}
      keyExtractor={(item, index) => `${item.uri}-${index}`}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => (
        <Animated.View
          entering={FadeInDown.delay(index * 100)}
          style={styles.recipeCard}
        >
          <TouchableOpacity
            style={styles.recipeCardContent}
            onPress={() => handleRecipePress(item.uri)}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeTitle} numberOfLines={2}>{item.label}</Text>
              <View style={styles.recipeMetaContainer}>
                <View style={styles.recipeMeta}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.recipeMetaText}>
                    {item.totalTime > 0 ? `${item.totalTime} min` : 'N/A'}
                  </Text>
                </View>
                {item.dietLabels && item.dietLabels.length > 0 && (
                  <View style={styles.dietLabel}>
                    <Text style={styles.dietLabelText}>{item.dietLabels[0]}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color="#2A9D8F" />
            <Text style={styles.loadMoreText}>Loading more recipes...</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  recipeCard: {
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
  recipeCardContent: {
    width: '100%',
  },
  recipeImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginBottom: 8,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dietLabel: {
    backgroundColor: '#E9F5F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dietLabelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#2A9D8F',
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadMoreText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
});
