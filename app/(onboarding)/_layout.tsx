import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="dislikes" />
      <Stack.Screen name="servings" />
      <Stack.Screen name="reminders" />
    </Stack>
  );
}