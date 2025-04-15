import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2, Copy, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProfile } from '@/lib/profile';
import ProfileImage from '@/components/ProfileImage';
import { getUserStats } from '@/lib/progress';
import * as Clipboard from 'expo-clipboard';

export default function ShareProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalMealsCooked: 0,
    totalMealPlansCreated: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedAchievements: 0,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load user profile
      const userProfile = await getUserProfile();
      setProfile(userProfile);

      // Load user stats
      const statsData = await getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Check out my cooking profile on Meal Planner!\n\nUsername: ${profile?.username}\nLevel: ${profile?.level}\nMeals Cooked: ${stats.totalMealsCooked}\nStreak: ${stats.currentStreak} days\n\nDownload the app to connect with me!`;

      await Share.share({
        message: shareMessage,
        title: 'Share Meal Planner Profile',
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const handleCopyUsername = async () => {
    if (profile?.username) {
      await Clipboard.setStringAsync(profile.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <Text style={styles.title}>Share Profile</Text>
      </Animated.View>

      <View style={styles.content}>
        {/* Profile Card */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.profileCard}
        >
          <LinearGradient
            colors={["#2A9D8F", "#264653"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.profileCardGradient}
          >
            <View style={styles.profileHeader}>
              <ProfileImage
                uri={profile?.avatar_url}
                username={profile?.username || 'User'}
                size={60}
                style={styles.profileImage}
              />

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile?.username || 'User'}</Text>
                <Text style={styles.profileLevel}>Level {profile?.level || 1}</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalMealsCooked}</Text>
                <Text style={styles.statLabel}>Meals</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalMealPlansCreated}</Text>
                <Text style={styles.statLabel}>Plans</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Share Options */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.shareOptions}
        >
          <Text style={styles.shareTitle}>Share Your Profile</Text>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>

          <View style={styles.usernameContainer}>
            <Text style={styles.usernameLabel}>Your Username</Text>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{profile?.username || 'User'}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyUsername}
              >
                {copied ? (
                  <Check size={20} color="#2A9D8F" />
                ) : (
                  <Copy size={20} color="#2A9D8F" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.usernameHelp}>
              Share your username with friends so they can find you in the app
            </Text>
          </View>
        </Animated.View>

        {/* Coming Soon */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.comingSoonContainer}
        >
          <Text style={styles.comingSoonTitle}>More Social Features Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We're working on adding more social features to help you connect with friends,
            share meal plans, and compete in cooking challenges.
          </Text>
        </Animated.View>
      </View>
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
    padding: 16,
  },
  profileCard: {
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
    marginBottom: 16,
  },
  profileCardGradient: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  profileLevel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shareOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  shareTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#264653',
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A9D8F',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  shareButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  usernameContainer: {
    marginTop: 8,
  },
  usernameLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#264653',
    marginBottom: 8,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  username: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#495057',
  },
  copyButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameHelp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
    marginTop: 8,
  },
  comingSoonContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  comingSoonTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#264653',
    marginBottom: 8,
  },
  comingSoonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
  },
});
