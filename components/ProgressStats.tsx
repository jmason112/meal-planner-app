import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getUserStats } from '@/lib/progress';
import { Award, Calendar, ChefHat, Flame } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ProgressStatsProps {
  refreshTrigger?: number; // Pass a changing value to trigger refresh
}

export default function ProgressStats({ refreshTrigger }: ProgressStatsProps) {
  const [stats, setStats] = useState({
    totalMealsCooked: 0,
    totalMealPlansCreated: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedAchievements: 0,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2A9D8F" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100)} style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <ChefHat size={20} color="#2A9D8F" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.totalMealsCooked}</Text>
            <Text style={styles.statLabel}>Meals Cooked</Text>
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Calendar size={20} color="#F4A261" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.totalMealPlansCreated}</Text>
            <Text style={styles.statLabel}>Plans Created</Text>
          </View>
        </View>
      </Animated.View>
      
      <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Flame size={20} color="#E76F51" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Award size={20} color="#E9C46A" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#264653',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#E76F51',
    textAlign: 'center',
  },
});
