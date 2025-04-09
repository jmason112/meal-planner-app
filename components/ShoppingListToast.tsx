import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  runOnJS
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

interface ShoppingListToastProps {
  visible: boolean;
  onHide: () => void;
  message?: string;
}

export function ShoppingListToast({ visible, onHide, message = 'Added to shopping list' }: ShoppingListToastProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);

      // Hide after 2 seconds
      const timeout = setTimeout(() => {
        translateY.value = withTiming(100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onHide)();
        });
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Check size={20} color="#fff" />
        </View>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#264653',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  iconContainer: {
    backgroundColor: '#2A9D8F',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#fff',
  },
});