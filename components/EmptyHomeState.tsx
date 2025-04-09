import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  SlideInRight
} from 'react-native-reanimated';
import { ChefHat, Calendar, Utensils, ArrowRight, Sparkles, ShoppingBag, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EmptyHomeState = ({ userName }: { userName: string }) => {
  const router = useRouter();
  
  // Animation values
  const plateScale = useSharedValue(1);
  const calendarY = useSharedValue(0);
  const chefHatRotate = useSharedValue(0);
  const bagX = useSharedValue(0);
  const heartScale = useSharedValue(1);
  
  // Set up animations
  useEffect(() => {
    // Plate subtle pulse
    plateScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Calendar gentle float
    calendarY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Chef hat gentle wobble
    chefHatRotate.value = withRepeat(
      withSequence(
        withTiming(-0.1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.1, { duration: 1000, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Shopping bag swing
    bagX.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(5, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Heart beat
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 500, easing: Easing.in(Easing.quad) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);
  
  // Animated styles
  const plateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plateScale.value }]
  }));
  
  const calendarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: calendarY.value }]
  }));
  
  const chefHatStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chefHatRotate.value}rad` }]
  }));
  
  const bagStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bagX.value }]
  }));
  
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }]
  }));
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F9F8" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#F0F9F8', '#FFFFFF']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <Animated.View 
          style={styles.welcomeContainer}
          entering={FadeInDown.duration(800)}
        >
          <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
          <Text style={styles.subtitleText}>Let's start your meal planning journey</Text>
        </Animated.View>
        
        <View style={styles.illustrationContainer}>
          {/* Background circle */}
          <Animated.View 
            style={styles.backgroundCircle}
            entering={ZoomIn.duration(800).delay(200)}
          />
          
          {/* Chef hat */}
          <Animated.View 
            style={[styles.iconContainer, chefHatStyle, { top: 20, left: width / 2 - 100 }]}
            entering={FadeInDown.duration(800).delay(400)}
          >
            <ChefHat size={48} color="#264653" />
          </Animated.View>
          
          {/* Calendar */}
          <Animated.View 
            style={[styles.iconContainer, calendarStyle, { top: 40, right: width / 2 - 100 }]}
            entering={FadeInDown.duration(800).delay(600)}
          >
            <Calendar size={40} color="#2A9D8F" />
          </Animated.View>
          
          {/* Plate/Utensils */}
          <Animated.View 
            style={[styles.iconContainer, plateStyle, { bottom: 30, left: width / 2 - 20 }]}
            entering={FadeInDown.duration(800).delay(800)}
          >
            <Utensils size={44} color="#F4A261" />
          </Animated.View>
          
          {/* Shopping Bag */}
          <Animated.View 
            style={[styles.iconContainer, bagStyle, { bottom: 60, right: width / 2 - 80 }]}
            entering={FadeInDown.duration(800).delay(1000)}
          >
            <ShoppingBag size={36} color="#E9C46A" />
          </Animated.View>
          
          {/* Heart */}
          <Animated.View 
            style={[styles.iconContainer, heartStyle, { top: 80, left: width / 2 - 40 }]}
            entering={FadeInDown.duration(800).delay(1200)}
          >
            <Heart size={28} color="#E76F51" fill="#E76F51" />
          </Animated.View>
        </View>
        
        <Animated.View
          style={styles.cardsContainer}
          entering={SlideInRight.duration(800).delay(400)}
        >
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/meal-planner/create')}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardContent}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#F0F9F8' }]}>
                <Calendar size={24} color="#2A9D8F" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Create Your First Meal Plan</Text>
                <Text style={styles.actionDescription}>
                  Organize your meals for the week and simplify your cooking routine
                </Text>
              </View>
              <ArrowRight size={20} color="#2A9D8F" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/recipe-index')}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardContent}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#FDF6F0' }]}>
                <Utensils size={24} color="#F4A261" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Browse Recipes</Text>
                <Text style={styles.actionDescription}>
                  Discover delicious recipes to add to your meal plans
                </Text>
              </View>
              <ArrowRight size={20} color="#F4A261" />
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View
          style={styles.tipContainer}
          entering={FadeInDown.duration(800).delay(1000)}
        >
          <View style={styles.tipIconContainer}>
            <Sparkles size={20} color="#E9C46A" />
          </View>
          <Text style={styles.tipText}>
            <Text style={styles.tipTextBold}>Pro Tip:</Text> Create a meal plan to automatically generate a shopping list for all your ingredients!
          </Text>
        </Animated.View>
        
        <Animated.View
          entering={FadeInDown.duration(800).delay(1200)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/meal-planner/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Start Planning</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  welcomeContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  welcomeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#264653',
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 20,
  },
  illustrationContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F8F9FA',
    top: 0,
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
  cardsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
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
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginBottom: 4,
  },
  actionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAEB',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
    lineHeight: 20,
  },
  tipTextBold: {
    fontFamily: 'Inter-SemiBold',
    color: '#264653',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 16,
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
});

export default EmptyHomeState;
