import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Utensils, Leaf, Heart } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

export default function Welcome() {
  const router = useRouter();

  const handleSignIn = async () => {
    // Sign out any existing session first
    await supabase.auth.signOut();
    router.push('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?q=80&w=2070&auto=format&fit=crop' }}
        style={styles.backgroundImage}
      />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      />

      <View style={styles.content}>
        <Animated.View 
          entering={FadeIn.delay(300).springify()}
          style={styles.iconContainer}
        >
          <View style={styles.iconWrapper}>
            <Utensils size={32} color="#F4A261" />
          </View>
          <View style={styles.iconWrapper}>
            <Leaf size={32} color="#E9C46A" />
          </View>
          <View style={styles.iconWrapper}>
            <Heart size={32} color="#E76F51" />
          </View>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Text style={styles.title}>SmartMealSaver</Text>
          <Text style={styles.subtitle}>
            Your personal assistant for meal planning, recipe discovery, and healthy eating
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(700).springify()}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/sign-up')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignIn}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 48,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    justifyContent: 'center',
  },
  iconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 36,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.9,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#E9C46A',
    paddingVertical: 16,
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
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});