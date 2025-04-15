import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, Trophy, Award, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProfile, getLevelInfo } from '@/lib/profile';
import { getUserStats, getUserAchievements } from '@/lib/progress';

export default function LevelDetails() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [levelInfo, setLevelInfo] = useState(null);
  const [stats, setStats] = useState({
    totalMealsCooked: 0,
    totalMealPlansCreated: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedAchievements: 0,
    totalPoints: 0,
  });
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      
      // Load level information
      const levelData = await getLevelInfo();
      setLevelInfo(levelData);
      
      // Load user stats
      const statsData = await getUserStats();
      setStats(statsData);
      
      // Load recent achievements
      const achievements = await getUserAchievements();
      const completed = achievements
        .filter(a => a.completed)
        .sort((a, b) => new Date(b.achieved_at) - new Date(a.achieved_at))
        .slice(0, 3);
      setRecentAchievements(completed);
    } catch (error) {
      console.error('Error loading level data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading level data...</Text>
      </View>
    );
  }

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
        <Text style={styles.title}>Level & XP</Text>
      </Animated.View>

      <ScrollView style={styles.content}>
        {/* Level Card */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.levelCard}
        >
          <LinearGradient
            colors={["#2A9D8F", "#264653"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.levelCardGradient}
          >
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Trophy size={24} color="#FFFFFF" />
                <Text style={styles.levelText}>Level {levelInfo?.currentLevel || 1}</Text>
              </View>
              <Text style={styles.xpText}>{levelInfo?.currentXp || 0} XP</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[styles.progressBar, { width: `${levelInfo?.progress || 0}%` }]}
              />
            </View>
            
            <Text style={styles.nextLevelText}>
              {levelInfo?.xpForNextLevel || 100} XP to Level {(levelInfo?.currentLevel || 1) + 1}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* XP Breakdown */}
        <Animated.View 
          entering={FadeInDown.delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>XP Breakdown</Text>
          
          <View style={styles.xpBreakdownItem}>
            <View style={styles.xpBreakdownLeft}>
              <Award size={20} color="#F4A261" />
              <Text style={styles.xpBreakdownText}>Achievements</Text>
            </View>
            <Text style={styles.xpBreakdownValue}>
              {stats.completedAchievements} × 10 = {stats.completedAchievements * 10} XP
            </Text>
          </View>
          
          <View style={styles.xpBreakdownItem}>
            <View style={styles.xpBreakdownLeft}>
              <Trophy size={20} color="#E76F51" />
              <Text style={styles.xpBreakdownText}>Meal Streak</Text>
            </View>
            <Text style={styles.xpBreakdownValue}>
              {stats.currentStreak} × 5 = {stats.currentStreak * 5} XP
            </Text>
          </View>
          
          <View style={styles.xpBreakdownItem}>
            <View style={styles.xpBreakdownLeft}>
              <Star size={20} color="#E9C46A" />
              <Text style={styles.xpBreakdownText}>Meals Cooked</Text>
            </View>
            <Text style={styles.xpBreakdownValue}>
              {stats.totalMealsCooked} × 2 = {stats.totalMealsCooked * 2} XP
            </Text>
          </View>
        </Animated.View>

        {/* Level Benefits */}
        <Animated.View 
          entering={FadeInDown.delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Level Benefits</Text>
          
          <View style={styles.benefitCard}>
            <View style={styles.benefitHeader}>
              <Trophy size={20} color="#2A9D8F" />
              <Text style={styles.benefitTitle}>Current Level Benefits</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Access to basic recipe collection</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Create up to 5 meal plans</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Standard achievement rewards</Text>
            </View>
          </View>
          
          <View style={styles.benefitCard}>
            <View style={styles.benefitHeader}>
              <Star size={20} color="#F4A261" />
              <Text style={styles.benefitTitle}>Next Level Benefits</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Unlock premium recipe filters</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Create unlimited meal plans</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Enhanced achievement rewards</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Achievements */}
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/profile/achievements')}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <ChevronRight size={16} color="#2A9D8F" />
            </TouchableOpacity>
          </View>
          
          {recentAchievements.length > 0 ? (
            recentAchievements.map((achievement, index) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View style={styles.achievementLeft}>
                  <Award size={20} color="#F4A261" />
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.achievement_type?.name}</Text>
                    <Text style={styles.achievementDescription}>{achievement.achievement_type?.description}</Text>
                  </View>
                </View>
                <Text style={styles.achievementPoints}>+{achievement.achievement_type?.points} XP</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyAchievements}>
              <Award size={32} color="#ADB5BD" />
              <Text style={styles.emptyText}>No achievements yet</Text>
              <Text style={styles.emptySubtext}>Complete tasks to earn achievements and XP</Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  levelCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelCardGradient: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  xpText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E9C46A',
    borderRadius: 6,
  },
  nextLevelText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'right',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#264653',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
  },
  xpBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  xpBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpBreakdownText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#495057',
    marginLeft: 12,
  },
  xpBreakdownValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
  },
  benefitCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginLeft: 8,
  },
  benefitItem: {
    marginBottom: 8,
  },
  benefitText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
  },
  achievementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  achievementInfo: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#264653',
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  achievementPoints: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2A9D8F',
  },
  emptyAchievements: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#495057',
    marginTop: 12,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
    textAlign: 'center',
  },
});
