import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, Save, RotateCcw, ChevronLeft, ChevronRight, Award } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { getUserPreferences, saveUserPreferences, resetPreferences, type UserPreferences } from '@/lib/preferences';

const ALLERGIES = ['dairy', 'gluten', 'seafood', 'eggs', 'nuts', 'soy'];
const DISLIKES = ['redMeat', 'vegetables', 'seafood', 'desserts', 'spicy', 'dairy'];

export default function PreferencesScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await getUserPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setLoading(true);
      await saveUserPreferences(preferences);
      router.back();
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const defaultPrefs = await resetPreferences();
      setPreferences(defaultPrefs);
    } catch (err) {
      setError('Failed to reset preferences');
    } finally {
      setLoading(false);
    }
  };

  if (!preferences) {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeIn}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </Animated.View>
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
          <ChevronLeft size={24} color="#264653" />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
        >
          <RotateCcw size={20} color="#666" />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </Animated.View>

      {error && (
        <Animated.View
          entering={FadeInDown}
          style={styles.errorContainer}
        >
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(200)}
          layout={Layout.springify()}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Preference</Text>
            <View style={styles.preferenceCard}>
              {['general', 'vegetarian', 'keto', 'paleo', 'vegan', 'pescatarian'].map((diet, index) => (
                <Animated.View
                  key={diet}
                  entering={FadeInDown.delay(index * 100)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    style={[
                      styles.dietOption,
                      preferences.dietary_preference === diet && styles.selectedDiet
                    ]}
                    onPress={() => setPreferences(prev => ({
                      ...prev!,
                      dietary_preference: diet
                    }))}
                  >
                    <Text style={[
                      styles.dietText,
                      preferences.dietary_preference === diet && styles.selectedDietText
                    ]}>
                      {diet.charAt(0).toUpperCase() + diet.slice(1)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            <View style={styles.preferenceCard}>
              <View style={styles.chipContainer}>
                {ALLERGIES.map((allergy, index) => (
                  <Animated.View
                    key={allergy}
                    entering={FadeInDown.delay(300 + index * 50)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        preferences.allergies.includes(allergy) && styles.selectedChip
                      ]}
                      onPress={() => {
                        setPreferences(prev => ({
                          ...prev!,
                          allergies: prev!.allergies.includes(allergy)
                            ? prev!.allergies.filter(a => a !== allergy)
                            : [...prev!.allergies, allergy]
                        }));
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        preferences.allergies.includes(allergy) && styles.selectedChipText
                      ]}>
                        {allergy.charAt(0).toUpperCase() + allergy.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dislikes</Text>
            <View style={styles.preferenceCard}>
              <View style={styles.chipContainer}>
                {DISLIKES.map((dislike, index) => (
                  <Animated.View
                    key={dislike}
                    entering={FadeInDown.delay(400 + index * 50)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        preferences.dislikes.includes(dislike) && styles.selectedChip
                      ]}
                      onPress={() => {
                        setPreferences(prev => ({
                          ...prev!,
                          dislikes: prev!.dislikes.includes(dislike)
                            ? prev!.dislikes.filter(d => d !== dislike)
                            : [...prev!.dislikes, dislike]
                        }));
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        preferences.dislikes.includes(dislike) && styles.selectedChipText
                      ]}>
                        {dislike.charAt(0).toUpperCase() + dislike.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servings</Text>
            <Animated.View
              entering={FadeInDown.delay(500)}
              style={styles.preferenceCard}
            >
              <View style={styles.servingsContainer}>
                <TouchableOpacity
                  style={styles.servingButton}
                  onPress={() => setPreferences(prev => ({
                    ...prev!,
                    servings: Math.max(1, prev!.servings - 1)
                  }))}
                >
                  <Text style={styles.servingButtonText}>-</Text>
                </TouchableOpacity>
                <Animated.Text style={styles.servingCount}>
                  {preferences.servings}
                </Animated.Text>
                <TouchableOpacity
                  style={styles.servingButton}
                  onPress={() => setPreferences(prev => ({
                    ...prev!,
                    servings: Math.min(10, prev!.servings + 1)
                  }))}
                >
                  <Text style={styles.servingButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Tracking</Text>
            <Animated.View
              entering={FadeInDown.delay(600)}
              style={styles.preferenceCard}
            >
              <TouchableOpacity
                style={styles.navigationItem}
                onPress={() => router.push('/progress-preferences')}
              >
                <View style={styles.navigationItemContent}>
                  <Award size={20} color="#2A9D8F" />
                  <Text style={styles.navigationItemText}>Progress Tracking Settings</Text>
                </View>
                <ChevronRight size={20} color="#ADB5BD" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Reminders</Text>
            <View style={styles.preferenceCard}>
              {preferences.meal_reminders.map((reminder, index) => (
                <Animated.View
                  key={reminder.id}
                  entering={FadeInDown.delay(600 + index * 100)}
                  style={[
                    styles.reminderItem,
                    index < preferences.meal_reminders.length - 1 && styles.reminderBorder
                  ]}
                >
                  <View>
                    <Text style={styles.reminderTitle}>
                      {reminder.type.split(/(?=[A-Z])/).join(' ')}
                    </Text>
                    <Text style={styles.reminderTime}>{reminder.time}</Text>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={(enabled) => {
                      const newReminders = [...preferences.meal_reminders];
                      newReminders[index] = { ...reminder, enabled };
                      setPreferences(prev => ({
                        ...prev!,
                        meal_reminders: newReminders
                      }));
                    }}
                    trackColor={{ false: '#DDD', true: '#2A9D8F' }}
                    thumbColor={Platform.OS === 'ios' ? '#fff' : reminder.enabled ? '#fff' : '#f4f3f4'}
                  />
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(700)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
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
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  resetText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  navigationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    marginLeft: 12,
  },
  errorContainer: {
    backgroundColor: '#FFE3E3',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#E53E3E',
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
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
  preferenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dietOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedDiet: {
    backgroundColor: '#2A9D8F',
  },
  dietText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
  },
  selectedDietText: {
    color: '#fff',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedChip: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  chipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  selectedChipText: {
    color: '#fff',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  servingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingButtonText: {
    fontSize: 24,
    color: '#264653',
  },
  servingCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: '#264653',
    marginHorizontal: 24,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reminderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  reminderTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#264653',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  reminderTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A9D8F',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
});