import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircleAlert as AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AuthErrorProps {
  message: string;
}

export function AuthError({ message }: AuthErrorProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(200)}
      style={styles.container}
    >
      <AlertCircle size={20} color="#E76F51" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEAE7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  message: {
    marginLeft: 8,
    color: '#E76F51',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});