import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getUserAchievements, UserAchievement } from '@/lib/progress';
import { Award, Star, Calendar, ChefHat, Utensils, ShoppingBag, Heart, Globe, Trophy } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface AchievementsListProps {
  filter?: 'all' | 'completed' | 'in-progress';
  onSelect?: (achievement: UserAchievement) => void;
}

export default function AchievementsList({ filter = 'all', onSelect }: AchievementsListProps) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, [filter]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await getUserAchievements();
      
      // Filter achievements based on the filter prop
      let filteredData = data;
      if (filter === 'completed') {
        filteredData = data.filter(a => a.completed);
      } else if (filter === 'in-progress') {
        filteredData = data.filter(a => !a.completed);
      }
      
      setAchievements(filteredData);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getIconForCategory = (category: string, completed: boolean) => {
    const color = completed ? '#F4A261' : '#ADB5BD';
    const fill = completed ? '#F4A261' : 'transparent';
    
    switch (category) {
      case 'planning':
        return <Calendar size={24} color={color} />;
      case 'cooking':
        return <ChefHat size={24} color={color} />;
      case 'streak':
        return <Trophy size={24} color={color} fill={fill} />;
      case 'shopping':
        return <ShoppingBag size={24} color={color} />;
      case 'nutrition':
        return <Heart size={24} color={color} fill={fill} />;
      case 'diversity':
        return <Globe size={24} color={color} />;
      default:
        return <Award size={24} color={color} />;
    }
  };

  const getProgressPercentage = (achievement: UserAchievement) => {
    if (achievement.completed) return 100;
    
    const requirements = achievement.achievement_type?.requirements;
    if (!requirements) return 0;
    
    // Calculate progress based on the type of achievement
    if (requirements.meal_plans_created && achievement.progress.meal_plans_created) {
      return Math.min(100, Math.round((achievement.progress.meal_plans_created / requirements.meal_plans_created) * 100));
    }
    
    if (requirements.recipes_cooked && achievement.progress.recipes_cooked) {
      return Math.min(100, Math.round((achievement.progress.recipes_cooked / requirements.recipes_cooked) * 100));
    }
    
    if (requirements.consecutive_days && achievement.progress.consecutive_days) {
      return Math.min(100, Math.round((achievement.progress.consecutive_days / requirements.consecutive_days) * 100));
    }
    
    if (requirements.shopping_lists_completed && achievement.progress.shopping_lists_completed) {
      return Math.min(100, Math.round((achievement.progress.shopping_lists_completed / requirements.shopping_lists_completed) * 100));
    }
    
    if (requirements.healthy_recipes && achievement.progress.healthy_recipes) {
      return Math.min(100, Math.round((achievement.progress.healthy_recipes / requirements.healthy_recipes) * 100));
    }
    
    if (requirements.cuisine_types && achievement.progress.cuisine_types) {
      return Math.min(100, Math.round((achievement.progress.cuisine_types / requirements.cuisine_types) * 100));
    }
    
    return 0;
  };

  const renderAchievement = ({ item, index }: { item: UserAchievement, index: number }) => {
    const progressPercentage = getProgressPercentage(item);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <TouchableOpacity
          style={styles.achievementCard}
          onPress={() => onSelect && onSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.achievementIcon}>
            {getIconForCategory(item.achievement_type?.category || '', item.completed)}
          </View>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>{item.achievement_type?.name}</Text>
            <Text style={styles.achievementDescription}>{item.achievement_type?.description}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` },
                    item.completed ? styles.progressCompleted : null
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{progressPercentage}%</Text>
            </View>
          </View>
          <View style={styles.pointsContainer}>
            <Star size={16} color="#F4A261" fill={item.completed ? "#F4A261" : "transparent"} />
            <Text style={styles.pointsText}>{item.achievement_type?.points}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAchievements}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (achievements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Award size={48} color="#ADB5BD" />
        <Text style={styles.emptyTitle}>No achievements yet</Text>
        <Text style={styles.emptyText}>
          {filter === 'completed' 
            ? 'Complete achievements to see them here' 
            : filter === 'in-progress' 
              ? 'Start working on achievements to see them here'
              : 'Start using the app to earn achievements'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={achievements}
      renderItem={renderAchievement}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#264653',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2A9D8F',
    borderRadius: 3,
  },
  progressCompleted: {
    backgroundColor: '#F4A261',
  },
  progressText: {
    fontSize: 12,
    color: '#6C757D',
    width: 36,
    textAlign: 'right',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF6F0',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4A261',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E76F51',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#264653',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    maxWidth: 300,
  },
});
