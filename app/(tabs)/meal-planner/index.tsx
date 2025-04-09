import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Search, Plus, Star, Tag as TagIcon, CircleAlert as AlertCircle, MoreVertical, Edit } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getMealPlans, type MealPlan } from '@/lib/meal-plans';

export default function MealPlanner() {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadMealPlans = async () => {
    try {
      setError(null);
      // Sort by start_date descending to show newest plans first
      const plans = await getMealPlans({
        sort_by: 'start_date',
        sort_direction: 'desc'
      });
      setMealPlans(plans);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMealPlans();
  }, []);

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

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.header}
      >
        <Text style={styles.title}>Meal Plans</Text>
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
              {categories.map((category, index) => (
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
          {filteredMealPlans.map((plan, index) => (
            <Animated.View
              key={plan.id}
              entering={FadeInDown.delay(400 + index * 100)}
              style={[styles.mealPlanCard, plan.is_current && styles.currentMealPlanCard]}
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
                    {plan.is_current && (
                      <View style={styles.currentTag}>
                        <Text style={styles.currentTagText}>Current</Text>
                      </View>
                    )}
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
          ))}
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
    backgroundColor: '#F0F9F8',
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
});