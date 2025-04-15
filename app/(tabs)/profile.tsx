import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Settings, ChevronRight, LogOut, Award, Trophy, User, Edit, Star, Share2, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getUserProfile, getLevelInfo } from '@/lib/profile';
import { getUserStats } from '@/lib/progress';
import ProfileImage from '@/components/ProfileImage';

export default function Profile() {
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
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadProfileData();
  }, []);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
      return () => {};
    }, [])
  );

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load user profile
      const userProfile = await getUserProfile();
      setProfile(userProfile);

      // No need to verify avatar URL here anymore - ProfileImage component will handle it

      // Load level information
      const levelData = await getLevelInfo();
      setLevelInfo(levelData);

      // Load user stats
      const statsData = await getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // First clear the Supabase session
      await supabase.auth.signOut();

      // Then clear any local auth state
      await signOut();

      // Finally, redirect to the welcome screen
      router.replace('/(onboarding)');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={["#2A9D8F", "#264653"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <ProfileImage
              uri={profile?.avatar_url}
              username={profile?.username || 'User'}
              size={80}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.editProfileImageButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Edit size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.username || 'User'}</Text>
            <View style={styles.levelBadge}>
              <Trophy size={14} color="#FFFFFF" />
              <Text style={styles.levelText}>Level {levelInfo?.currentLevel || 1}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Level Progress Bar */}
        <View style={styles.levelProgressContainer}>
          <View style={styles.levelProgressInfo}>
            <Text style={styles.levelProgressText}>Level {levelInfo?.currentLevel || 1}</Text>
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
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Bio Section */}
        {profile?.bio ? (
          <Animated.View
            entering={FadeInDown.delay(100)}
            style={styles.bioSection}
          >
            <Text style={styles.bioText}>{profile.bio}</Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(100)}
            style={styles.bioSection}
          >
            <TouchableOpacity
              style={styles.addBioButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Text style={styles.addBioText}>Add a bio to your profile</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Stats Section */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.statsSection}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalMealsCooked}</Text>
            <Text style={styles.statLabel}>Meals Cooked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalMealPlansCreated}</Text>
            <Text style={styles.statLabel}>Plans Created</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </Animated.View>

        {/* Progress & Rewards Section */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Progress & Rewards</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/achievements')}
          >
            <View style={styles.menuItemContent}>
              <Award size={20} color="#F4A261" />
              <Text style={styles.menuItemText}>Achievements & Rewards</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemCount}>{stats.completedAchievements}</Text>
              <ChevronRight size={20} color="#ADB5BD" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/level')}
          >
            <View style={styles.menuItemContent}>
              <Star size={20} color="#E9C46A" />
              <Text style={styles.menuItemText}>Level & XP</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemCount}>{stats.totalPoints} XP</Text>
              <ChevronRight size={20} color="#ADB5BD" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Social Section (Placeholder for future) */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Social</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/friends')}
          >
            <View style={styles.menuItemContent}>
              <Users size={20} color="#2A9D8F" />
              <Text style={styles.menuItemText}>Friends</Text>
            </View>
            <ChevronRight size={20} color="#ADB5BD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/share')}
          >
            <View style={styles.menuItemContent}>
              <Share2 size={20} color="#2A9D8F" />
              <Text style={styles.menuItemText}>Share Profile</Text>
            </View>
            <ChevronRight size={20} color="#ADB5BD" />
          </TouchableOpacity>
        </Animated.View>

        {/* Settings Section */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(settings)/preferences')}
          >
            <View style={styles.menuItemContent}>
              <Settings size={20} color="#2A9D8F" />
              <Text style={styles.menuItemText}>Preferences</Text>
            </View>
            <ChevronRight size={20} color="#ADB5BD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/account')}
          >
            <View style={styles.menuItemContent}>
              <User size={20} color="#2A9D8F" />
              <Text style={styles.menuItemText}>Account Settings</Text>
            </View>
            <ChevronRight size={20} color="#ADB5BD" />
          </TouchableOpacity>
        </Animated.View>

        {/* Sign Out Section */}
        <Animated.View
          entering={FadeInDown.delay(600)}
          style={styles.section}
        >
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#E76F51" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editProfileImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2A9D8F',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editProfileText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  levelProgressContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  levelProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  levelProgressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  xpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E9C46A',
    borderRadius: 4,
  },
  nextLevelText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  bioSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
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
  bioText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  addBioButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A9D8F',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBioText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#2A9D8F',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#264653',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E9ECEF',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#264653',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6C757D',
    marginRight: 8,
  },
  menuItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3F0',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  signOutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#E76F51',
    marginLeft: 8,
  },
});