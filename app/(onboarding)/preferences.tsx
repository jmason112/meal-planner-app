import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Salad, Beef, Leaf, Siren as Fire } from 'lucide-react-native';
import { saveUserPreferences } from '@/lib/preferences';

const PREFERENCES = [
  {
    id: 'general',
    title: 'General',
    description: 'No specific dietary restrictions',
    icon: Salad,
  },
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    description: 'Plant-based diet, no meat',
    icon: Leaf,
  },
  {
    id: 'keto',
    title: 'Keto',
    description: 'High-fat, low-carb diet',
    icon: Fire,
  },
  {
    id: 'paleo',
    title: 'Paleo',
    description: 'Based on foods similar to what hunter-gatherers ate',
    icon: Beef,
  },
];

export default function DietaryPreferences() {
  const router = useRouter();

  const handlePreferenceSelect = async (preference: string) => {
    try {
      await saveUserPreferences({
        dietary_preference: preference
      });
      router.push('/allergies');
    } catch (error) {
      console.error('Error saving preference:', error);
      // Continue anyway since we can sync later
      router.push('/allergies');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your preferred diet?</Text>
      <Text style={styles.subtitle}>
        This helps us personalize your meal recommendations
      </Text>

      <ScrollView style={styles.scrollView}>
        {PREFERENCES.map((preference) => (
          <TouchableOpacity
            key={preference.id}
            style={styles.preferenceCard}
            onPress={() => handlePreferenceSelect(preference.id)}
          >
            <preference.icon size={32} color="#2A9D8F" />
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>{preference.title}</Text>
              <Text style={styles.preferenceDescription}>
                {preference.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.push('/allergies')}
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
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
  preferenceContent: {
    marginLeft: 16,
    flex: 1,
  },
  preferenceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
});