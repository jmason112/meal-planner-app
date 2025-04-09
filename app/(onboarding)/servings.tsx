import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue
} from 'react-native-reanimated';
import { Users, ChevronRight, Minus, Plus } from 'lucide-react-native';
import { saveUserPreferences } from '@/lib/preferences';

export default function Servings() {
  const router = useRouter();
  const [servings, setServings] = useState(2);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const updateServings = (increment: boolean) => {
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
    setServings(prev => increment ? Math.min(prev + 1, 10) : Math.max(prev - 1, 1));
  };

  const handleContinue = async () => {
    try {
      await saveUserPreferences({
        servings
      });
      router.push('/reminders');
    } catch (error) {
      console.error('Error saving servings:', error);
      // Continue anyway since we can sync later
      router.push('/reminders');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.header}
      >
        <Text style={styles.title}>How many servings?</Text>
        <Text style={styles.subtitle}>
          We'll adjust recipe portions to match your needs
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.delay(400).springify()}
        style={styles.content}
      >
        <View style={styles.servingsCard}>
          <Users size={48} color="#2A9D8F" />
          <Animated.View style={[styles.servingsContainer, animatedStyle]}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => updateServings(false)}
            >
              <Minus size={24} color="#264653" />
            </TouchableOpacity>
            
            <Text style={styles.servingsNumber}>{servings}</Text>
            
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => updateServings(true)}
            >
              <Plus size={24} color="#264653" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.servingsText}>servings</Text>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.delay(600).springify()}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  servingsCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  adjustButton: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 24,
  },
  servingsNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 48,
    color: '#264653',
    minWidth: 80,
    textAlign: 'center',
  },
  servingsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: '#666',
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