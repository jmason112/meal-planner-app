import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import EmptyMealPlanState from '@/components/EmptyMealPlanState';
import { useRouter, useFocusEffect } from 'expo-router';
import { Calendar, Search, Plus, Star, Tag as TagIcon, CircleAlert as AlertCircle, Edit, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getMealPlans, type MealPlan } from '@/lib/meal-plans';
import { updateCurrentMealPlan } from '@/lib/meal-plan-scheduler';

export default function MealPlanner() {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadMealPlans = async () => {
    try {
      setError(null);
      // Get all meal plans
      const plans = await getMealPlans({
        status: 'active'
      });

      // Sort plans: current plan first, then by start_date ascending for future plans
      const today = new Date().toISOString().split('T')[0];

      const sortedPlans = [...plans].sort((a, b) => {
        // Current plan always comes first
        if (a.is_current) return -1;
        if (b.is_current) return 1;

        // For non-current plans, sort by start_date
        // Plans that start in the future come before plans that are in the past
        const aStartDate = a.start_date || '';
        const bStartDate = b.start_date || '';

        // Future plans (start date >= today)
        const aIsFuture = aStartDate >= today;
        const bIsFuture = bStartDate >= today;

        if (aIsFuture && !bIsFuture) return -1; // Future plans before past plans
        if (!aIsFuture && bIsFuture) return 1; // Past plans after future plans

        // Both future or both past, sort by start date
        if (aIsFuture && bIsFuture) {
          // For future plans, sort by start date ascending (closest future date first)
          return aStartDate.localeCompare(bStartDate);
        } else {
          // For past plans, sort by start date descending (most recent past date first)
          return bStartDate.localeCompare(aStartDate);
        }
      });

      setMealPlans(sortedPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMealPlans();
  }, []);

  // Refresh meal plans when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Meal planner screen focused - refreshing meal plans');
      loadMealPlans();
      return () => {};
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // First update the current meal plan status
      await updateCurrentMealPlan();
      // Then reload the meal plans
      await loadMealPlans();
    } catch (error) {
      console.error('Error refreshing meal plans:', error);
      setError('Failed to refresh meal plans');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getMealPlanCardStyle = (plan: MealPlan, index: number) => {
    if (plan.is_current) {
      return styles.currentMealPlanCard;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (plan.start_date && new Date(plan.start_date) > today) {
      if (index === 1) {
        return styles.nextMealPlanCard;
      } else if (index === 2) {
        return styles.upcomingMealPlanCard;
      } else {
        return styles.futureMealPlanCard;
      }
    }

    if (plan.end_date && new Date(plan.end_date) < today) {
      return styles.pastMealPlanCard;
    }

    return null;
  };

  const renderPlanStatusTag = (plan: MealPlan, index: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Current plan
    if (plan.is_current) {
      // Check if this plan actually covers today's date
      if (plan.start_date && plan.end_date &&
          plan.start_date <= todayStr && plan.end_date >= todayStr) {
        return (
          <View style={styles.currentTag}>
            <Text style={styles.currentTagText}>Current</Text>
          </View>
        );
      } else {
        // This plan is marked as current but doesn't cover today
        return (
          <View style={styles.currentTag}>
            <Text style={styles.currentTagText}>Active</Text>
          </View>
        );
      }
    }

    // Future plans
    if (plan.start_date && new Date(plan.start_date) > today) {
      // First future plan is "Next"
      if (index === 1) {
        return (
          <View style={styles.nextTag}>
            <Text style={styles.nextTagText}>Next</Text>
          </View>
        );
      }
      // Second future plan is "Upcoming"
      else if (index === 2) {
        return (
          <View style={styles.upcomingTag}>
            <Text style={styles.upcomingTagText}>Upcoming</Text>
          </View>
        );
      }
      // Other future plans show the start date
      else {
        const startDate = new Date(plan.start_date);
        const formattedDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <View style={styles.futureTag}>
            <Text style={styles.futureTagText}>Starts {formattedDate}</Text>
          </View>
        );
      }
    }

    // Past plans
    if (plan.end_date && new Date(plan.end_date) < today) {
      return (
        <View style={styles.pastTag}>
          <Text style={styles.pastTagText}>Past</Text>
        </View>
      );
    }

    // Default case (shouldn't happen, but just in case)
    return null;
  };

  const filteredMealPlans = mealPlans.filter(plan => {
    const matchesSearch = searchQuery
      ? plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plan.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesCategory = selectedCategory
      ? plan.category === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(mealPlans.map(plan => plan.category).filter(Boolean)));

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#E76F51" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadMealPlans}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading meal plans...</Text>
      </View>
    );
  }

  // Show empty state if there are no meal plans
  if (!isLoading && !refreshing && filteredMealPlans.length === 0 && !searchQuery && !selectedCategory) {
    return <EmptyMealPlanState />;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.header}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Meal Plans</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={async () => {
              try {
                setLoading(true);
                await updateCurrentMealPlan();
                await loadMealPlans();
                Alert.alert('Success', 'Meal plan status updated successfully');
              } catch (error) {
                console.error('Error updating meal plan status:', error);
                Alert.alert('Error', 'Failed to update meal plan status');
              } finally {
                setLoading(false);
              }
            }}
          >
            <RefreshCw size={20} color="#2A9D8F" />
            <Text style={styles.refreshButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meal plans..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2A9D8F"
            colors={['#2A9D8F']}
          />
        }
      >
        {categories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.mealPlansGrid}>
          {filteredMealPlans.length === 0 ? (
            <Animated.View
              style={styles.noResultsContainer}
              entering={FadeInDown.delay(400)}
            >
              <AlertCircle size={48} color="#ADB5BD" />
              <Text style={styles.noResultsText}>
                {searchQuery ?
                  `No meal plans found matching "${searchQuery}"` :
                  selectedCategory ?
                    `No meal plans found in category "${selectedCategory}"` :
                    'No meal plans found'}
              </Text>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            filteredMealPlans.map((plan, index) => (
            <Animated.View
              key={plan.id}
              entering={FadeInDown.delay(400 + index * 100)}
              style={[styles.mealPlanCard, getMealPlanCardStyle(plan, index)]}
            >
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push(`/meal-planner/edit?id=${plan.id}`)}
              >
                <Edit size={16} color="#2A9D8F" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mealPlanContent}
                onPress={() => router.push(`/meal-planner/view?id=${plan.id}`)}
              >
                {plan.is_favorite && (
                  <View style={styles.favoriteTag}>
                    <Star size={16} color="#FFB800" fill="#FFB800" />
                  </View>
                )}

                <View style={styles.mealPlanHeader}>
                  <Text style={styles.mealPlanName}>{plan.name}</Text>
                  <View style={styles.mealPlanTags}>
                    {renderPlanStatusTag(plan, index)}
                    {plan.category && (
                      <View style={styles.categoryTag}>
                        <TagIcon size={12} color="#2A9D8F" />
                        <Text style={styles.categoryTagText}>{plan.category}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {plan.description && (
                  <Text style={styles.mealPlanDescription} numberOfLines={2}>
                    {plan.description}
                  </Text>
                )}

                <View style={styles.mealPlanMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#666" />
                    <Text style={styles.metaText}>
                      {plan.start_date ? new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'} - {plan.end_date ? new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaText}>
                      {' '}{plan.recipes?.length || 0} meals
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/meal-planner/create')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 28,
    color: '#264653',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A9D8F',
  },
  refreshButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
    marginLeft: 6,
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
  content: {
    flex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  categoryChipSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  categoryChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  mealPlansGrid: {
    padding: 24,
    paddingTop: 8,
  },
  mealPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentMealPlanCard: {
    borderWidth: 2,
    borderColor: '#2A9D8F',
    backgroundColor: '#F0F9F8', // Light teal background
  },
  nextMealPlanCard: {
    borderWidth: 2,
    borderColor: '#F4A261', // Orange border
    backgroundColor: '#FDF6F0', // Light orange background
  },
  upcomingMealPlanCard: {
    borderWidth: 2,
    borderColor: '#E9C46A', // Yellow border
    backgroundColor: '#FDF9E9', // Light yellow background
  },
  futureMealPlanCard: {
    borderWidth: 2,
    borderColor: '#A8DADC', // Light blue border
    backgroundColor: '#F0F7F8', // Very light blue background
  },
  pastMealPlanCard: {
    borderWidth: 1,
    borderColor: '#ADB5BD', // Gray border
    backgroundColor: '#F8F9FA', // Light gray background
    opacity: 0.8, // Slightly faded
  },
  mealPlanContent: {
    padding: 16,
  },
  favoriteTag: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9F8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mealPlanHeader: {
    marginBottom: 8,
  },
  mealPlanTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  currentTag: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  nextTag: {
    backgroundColor: '#F4A261', // Orange color for next plan
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  nextTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  upcomingTag: {
    backgroundColor: '#E9C46A', // Yellow color for upcoming plan
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  upcomingTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  futureTag: {
    backgroundColor: '#A8DADC', // Light blue for future plans
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  futureTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#264653',
  },
  pastTag: {
    backgroundColor: '#ADB5BD', // Gray for past plans
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pastTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  mealPlanName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  categoryTagText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#2A9D8F',
  },
  mealPlanDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  mealPlanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
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
  createButton: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 32 : 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A9D8F',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#264653',
    marginTop: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 24,
  },
  noResultsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
  },
});