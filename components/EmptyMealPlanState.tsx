import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn
} from 'react-native-reanimated';
import { ChefHat, Calendar, Utensils, ArrowRight, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const EmptyMealPlanState = () => {
  const router = useRouter();
  
  // Animation values
  const chefHatRotate = useSharedValue(0);
  const plateScale = useSharedValue(1);
  const calendarY = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  
  // Set up animations
  useEffect(() => {
    // Chef hat gentle wobble
    chefHatRotate.value = withRepeat(
      withSequence(
        withTiming(-0.05, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.05, { duration: 1000, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Plate subtle pulse
    plateScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Calendar gentle float
    calendarY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Sparkles fade in and out
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);
  
  // Animated styles
  const chefHatStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chefHatRotate.value}rad` }]
  }));
  
  const plateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plateScale.value }]
  }));
  
  const calendarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: calendarY.value }]
  }));
  
  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value
  }));
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(800)}
    >
      <View style={styles.illustrationContainer}>
        {/* Background circle */}
        <Animated.View 
          style={styles.backgroundCircle}
          entering={ZoomIn.duration(800).delay(200)}
        />
        
        {/* Chef hat */}
        <Animated.View 
          style={[styles.iconContainer, chefHatStyle, { top: 20, left: width / 2 - 80 }]}
          entering={FadeInDown.duration(800).delay(400)}
        >
          <ChefHat size={48} color="#264653" />
        </Animated.View>
        
        {/* Calendar */}
        <Animated.View 
          style={[styles.iconContainer, calendarStyle, { top: 60, right: width / 2 - 100 }]}
          entering={FadeInDown.duration(800).delay(600)}
        >
          <Calendar size={40} color="#2A9D8F" />
        </Animated.View>
        
        {/* Plate/Utensils */}
        <Animated.View 
          style={[styles.iconContainer, plateStyle, { bottom: 40, left: width / 2 - 20 }]}
          entering={FadeInDown.duration(800).delay(800)}
        >
          <Utensils size={44} color="#F4A261" />
        </Animated.View>
        
        {/* Sparkles */}
        <Animated.View 
          style={[styles.iconContainer, sparkleStyle, { top: 40, right: width / 2 - 40 }]}
          entering={FadeInDown.duration(800).delay(1000)}
        >
          <Sparkles size={24} color="#E9C46A" />
        </Animated.View>
      </View>
      
      <Animated.Text 
        style={styles.title}
        entering={FadeInDown.duration(800).delay(300)}
      >
        Plan Your First Meal
      </Animated.Text>
      
      <Animated.Text 
        style={styles.subtitle}
        entering={FadeInDown.duration(800).delay(500)}
      >
        Create a personalized meal plan to organize your recipes, 
        track your progress, and simplify your grocery shopping.
      </Animated.Text>
      
      <Animated.View
        entering={FadeInDown.duration(800).delay(700)}
      >
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/meal-planner/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Create Meal Plan</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View
        style={styles.stepsContainer}
        entering={FadeInDown.duration(800).delay(900)}
      >
        <Text style={styles.stepsTitle}>How it works:</Text>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Choose your favorite recipes</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Organize them by day and meal type</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>Generate a shopping list with one tap</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  illustrationContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    marginBottom: 40,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F8F9FA',
    top: 10,
    left: '50%',
    marginLeft: -90,
  },
  iconContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#264653',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2A9D8F',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  stepsContainer: {
    marginTop: 48,
    width: '100%',
  },
  stepsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E9C46A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  stepText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
});

export default EmptyMealPlanState;
