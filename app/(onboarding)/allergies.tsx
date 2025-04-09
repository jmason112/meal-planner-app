import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Fish, Wheat, Milk, Egg, ChevronRight } from 'lucide-react-native';
import { saveUserPreferences } from '@/lib/preferences';

const ALLERGIES = [
  {
    id: 'dairy',
    title: 'Dairy',
    description: 'Milk, cheese, yogurt, and other dairy products',
    icon: Milk,
  },
  {
    id: 'gluten',
    title: 'Gluten',
    description: 'Wheat, barley, rye, and their derivatives',
    icon: Wheat,
  },
  {
    id: 'seafood',
    title: 'Seafood',
    description: 'Fish, shellfish, and other seafood',
    icon: Fish,
  },
  {
    id: 'eggs',
    title: 'Eggs',
    description: 'Chicken eggs and egg products',
    icon: Egg,
  },
];

export default function Allergies() {
  const router = useRouter();
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const toggleAllergy = (id: string) => {
    setSelectedAllergies(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleContinue = async () => {
    try {
      await saveUserPreferences({
        allergies: selectedAllergies
      });
      router.push('/dislikes');
    } catch (error) {
      console.error('Error saving allergies:', error);
      // Continue anyway since we can sync later
      router.push('/dislikes');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.header}
      >
        <Text style={styles.title}>Any food allergies?</Text>
        <Text style={styles.subtitle}>
          Select any allergies you have so we can customize your meal plans accordingly
        </Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {ALLERGIES.map((allergy, index) => (
          <Animated.View
            key={allergy.id}
            entering={FadeInUp.delay(300 + index * 100).springify()}
          >
            <TouchableOpacity
              style={[
                styles.allergyCard,
                selectedAllergies.includes(allergy.id) && styles.selectedCard
              ]}
              onPress={() => toggleAllergy(allergy.id)}
            >
              <allergy.icon 
                size={32} 
                color={selectedAllergies.includes(allergy.id) ? '#fff' : '#2A9D8F'} 
              />
              <View style={styles.allergyContent}>
                <Text style={[
                  styles.allergyTitle,
                  selectedAllergies.includes(allergy.id) && styles.selectedText
                ]}>
                  {allergy.title}
                </Text>
                <Text style={[
                  styles.allergyDescription,
                  selectedAllergies.includes(allergy.id) && styles.selectedText
                ]}>
                  {allergy.description}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View 
        entering={FadeInUp.delay(700).springify()}
        style={styles.footer}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
          <ChevronRight size={20} color="#fff" />
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
  header: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 28,
    color: '#264653',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  allergyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
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
  selectedCard: {
    backgroundColor: '#2A9D8F',
  },
  allergyContent: {
    marginLeft: 16,
    flex: 1,
  },
  allergyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 4,
  },
  allergyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  continueButton: {
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  continueText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#fff',
    marginRight: 8,
  },
});