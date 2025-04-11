import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Award, Gift, Trophy, Star } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getUserStats } from '@/lib/progress';
import AchievementsList from '@/components/AchievementsList';
import RewardsList from '@/components/RewardsList';
import ProgressStats from '@/components/ProgressStats';

export default function Achievements() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'achievements' | 'rewards'>('achievements');
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [rewardsFilter, setRewardsFilter] = useState<'all' | 'available' | 'redeemed'>('all');
  const [stats, setStats] = useState({
    totalMealsCooked: 0,
    totalMealPlansCreated: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedAchievements: 0,
    totalPoints: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    loadStats();
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.delay(100)}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#264653" />
        </TouchableOpacity>
        <Text style={styles.title}>Progress & Rewards</Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={styles.statsHeader}
      >
        <View style={styles.pointsContainer}>
          <Star size={20} color="#F4A261" fill="#F4A261" />
          <Text style={styles.pointsText}>{stats.totalPoints} Points</Text>
        </View>
        <View style={styles.streakContainer}>
          <Trophy size={20} color="#E76F51" />
          <Text style={styles.streakText}>{stats.currentStreak} Day Streak</Text>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(300)}
        style={styles.statsContainer}
      >
        <ProgressStats refreshTrigger={refreshTrigger} />
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(400)}
        style={styles.tabsContainer}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'achievements' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('achievements')}
        >
          <Award 
            size={20} 
            color={activeTab === 'achievements' ? "#FFFFFF" : "#264653"} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'achievements' && styles.activeTabText
          ]}>
            Achievements
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'rewards' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('rewards')}
        >
          <Gift 
            size={20} 
            color={activeTab === 'rewards' ? "#FFFFFF" : "#264653"} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'rewards' && styles.activeTabText
          ]}>
            Rewards
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {activeTab === 'achievements' && (
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[
              styles.filterText,
              activeFilter === 'all' && styles.activeFilterText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'completed' && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[
              styles.filterText,
              activeFilter === 'completed' && styles.activeFilterText
            ]}>
              Completed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'in-progress' && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter('in-progress')}
          >
            <Text style={[
              styles.filterText,
              activeFilter === 'in-progress' && styles.activeFilterText
            ]}>
              In Progress
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {activeTab === 'rewards' && (
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              rewardsFilter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => setRewardsFilter('all')}
          >
            <Text style={[
              styles.filterText,
              rewardsFilter === 'all' && styles.activeFilterText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              rewardsFilter === 'available' && styles.activeFilterButton
            ]}
            onPress={() => setRewardsFilter('available')}
          >
            <Text style={[
              styles.filterText,
              rewardsFilter === 'available' && styles.activeFilterText
            ]}>
              Available
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              rewardsFilter === 'redeemed' && styles.activeFilterButton
            ]}
            onPress={() => setRewardsFilter('redeemed')}
          >
            <Text style={[
              styles.filterText,
              rewardsFilter === 'redeemed' && styles.activeFilterText
            ]}>
              Redeemed
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.content}>
        {activeTab === 'achievements' ? (
          <AchievementsList 
            filter={activeFilter} 
            key={`achievements-${refreshTrigger}-${activeFilter}`}
          />
        ) : (
          <RewardsList 
            filter={rewardsFilter} 
            key={`rewards-${refreshTrigger}-${rewardsFilter}`}
            onRedeem={handleRefresh}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#264653',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF6F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4A261',
    marginLeft: 6,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E76F51',
    marginLeft: 6,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F8F9FA',
  },
  activeTabButton: {
    backgroundColor: '#2A9D8F',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#264653',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
  },
  activeFilterButton: {
    backgroundColor: '#E6F3F2',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeFilterText: {
    color: '#2A9D8F',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});
