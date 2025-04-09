import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Beef, Carrot, Fish, Cookie, ChevronRight } from 'lucide-react-native';
import { saveUserPreferences } from '@/lib/preferences';

const DISLIKES = [
  {
    id: 'redMeat',
    title: 'Red Meat',
    description: 'Beef, lamb, and pork',
    icon: Beef,
  },
  {
    id: 'vegetables',
    title: 'Vegetables',
    description: 'Specific vegetables you dislike',
    icon: Carrot,
  },
  {
    id: 'seafood',
    title: 'Seafood',
    description: 'Fish and shellfish',
    icon: Fish,
  },
  {
    id: 'desserts',
    title: 'Desserts',
    description: 'Sweet treats and desserts',
    icon: Cookie,
  },
];

export default function Dislikes() {
  const router = useRouter();
  const [selectedDislikes, setSelectedDislikes] = useState<string[]>([]);

  const toggleDislike = (id: string) => {
    setSelectedDislikes(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleContinue = async () => {
    try {
      await saveUserPreferences({
        dislikes: selectedDislikes
      });
      router.push('/servings');
    } catch (error) {
      console.error('Error saving dislikes:', error);
      // Continue anyway since we can sync later
      router.push('/servings');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.header}
      >
        <Text style={styles.title}>What foods do you dislike?</Text>
        <Text style={styles.subtitle}>
          Help us understand your food preferences better
        </Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {DISLIKES.map((dislike, index) => (
          <Animated.View
            key={dislike.id}
            entering={FadeInUp.delay(300 + index * 100).springify()}
          >
            <TouchableOpacity
              style={[
                styles.dislikeCard,
                selectedDislikes.includes(dislike.id) && styles.selectedCard
              ]}
              onPress={() => toggleDislike(dislike.id)}
            >
              <dislike.icon 
                size={32} 
                color={selectedDislikes.includes(dislike.id) ? '#fff' : '#E76F51'} 
              />
              <View style={styles.dislikeContent}>
                <Text style={[
                  styles.dislikeTitle,
                  selectedDislikes.includes(dislike.id) && styles.selectedText
                ]}>
                  {dislike.title}
                </Text>
                <Text style={[
                  styles.dislikeDescription,
                  selectedDislikes.includes(dislike.id) && styles.selectedText
                ]}>
                  {dislike.description}
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
  dislikeCard: {
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
    backgroundColor: '#E76F51',
  },
  dislikeContent: {
    marginLeft: 16,
    flex: 1,
  },
  dislikeTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 4,
  },
  dislikeDescription: {
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
    backgroundColor: '#E76F51',
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