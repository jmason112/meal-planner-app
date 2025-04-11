import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Coffee, UtensilsCrossed, Soup, Cookie, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getProgressTrackingPreferences, updateProgressTrackingPreferences, ProgressTrackingPreferences } from '@/lib/progress';

export default function ProgressPreferences() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<ProgressTrackingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await getProgressTrackingPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading progress preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof ProgressTrackingPreferences) => {
    if (!preferences || saving) return;

    try {
      setSaving(true);

      // Update local state first for immediate feedback
      const updatedPrefs = {
        ...preferences,
        [key]: !preferences[key]
      };
      setPreferences(updatedPrefs);

      // Save to database
      await updateProgressTrackingPreferences({ [key]: !preferences[key] });
    } catch (err) {
      console.error(`Error updating ${key}:`, err);
      setError(`Failed to update ${key}`);

      // Revert local state on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No preferences found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>Progress Tracking</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>General Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Progress Tracking</Text>
              <Text style={styles.settingDescription}>Track your meal planning and cooking progress</Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={() => handleToggle('enabled')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Track Meals</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Coffee size={20} color="#264653" />
                <Text style={styles.settingTitle}>Track Breakfast</Text>
              </View>
              <Text style={styles.settingDescription}>Track breakfast meals in your progress</Text>
            </View>
            <Switch
              value={preferences.track_breakfast}
              onValueChange={() => handleToggle('track_breakfast')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <UtensilsCrossed size={20} color="#264653" />
                <Text style={styles.settingTitle}>Track Lunch</Text>
              </View>
              <Text style={styles.settingDescription}>Track lunch meals in your progress</Text>
            </View>
            <Switch
              value={preferences.track_lunch}
              onValueChange={() => handleToggle('track_lunch')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Soup size={20} color="#264653" />
                <Text style={styles.settingTitle}>Track Dinner</Text>
              </View>
              <Text style={styles.settingDescription}>Track dinner meals in your progress</Text>
            </View>
            <Switch
              value={preferences.track_dinner}
              onValueChange={() => handleToggle('track_dinner')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Cookie size={20} color="#264653" />
                <Text style={styles.settingTitle}>Track Snacks</Text>
              </View>
              <Text style={styles.settingDescription}>Track snacks in your progress</Text>
            </View>
            <Switch
              value={preferences.track_snack}
              onValueChange={() => handleToggle('track_snack')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <ShoppingBag size={20} color="#264653" />
                <Text style={styles.settingTitle}>Track Shopping</Text>
              </View>
              <Text style={styles.settingDescription}>Track shopping list completion</Text>
            </View>
            <Switch
              value={preferences.track_shopping}
              onValueChange={() => handleToggle('track_shopping')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Bell size={20} color="#264653" />
                <Text style={styles.settingTitle}>Enable Notifications</Text>
              </View>
              <Text style={styles.settingDescription}>Receive notifications about your progress</Text>
            </View>
            <Switch
              value={preferences.notifications_enabled}
              onValueChange={() => handleToggle('notifications_enabled')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Daily Goal Notifications</Text>
              <Text style={styles.settingDescription}>Get reminders about your daily goals</Text>
            </View>
            <Switch
              value={preferences.daily_goal_notifications}
              onValueChange={() => handleToggle('daily_goal_notifications')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled || !preferences.notifications_enabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Achievement Notifications</Text>
              <Text style={styles.settingDescription}>Get notified when you earn achievements</Text>
            </View>
            <Switch
              value={preferences.achievement_notifications}
              onValueChange={() => handleToggle('achievement_notifications')}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
              disabled={saving || !preferences.enabled || !preferences.notifications_enabled}
            />
          </View>
        </Animated.View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#264653',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#264653',
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 28,
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
});
