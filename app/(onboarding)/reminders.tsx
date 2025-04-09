import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Bell, ShoppingBag, Utensils, ChevronRight } from 'lucide-react-native';
import { saveUserPreferences, type MealReminder } from '@/lib/preferences';

const REMINDER_TYPES = [
  {
    id: 'mealPlanning',
    title: 'Meal Planning',
    description: 'Get reminded to plan your meals for the week',
    icon: Utensils,
    defaultTime: '18:00',
  },
  {
    id: 'shopping',
    title: 'Shopping List',
    description: 'Notifications for your grocery shopping list',
    icon: ShoppingBag,
    defaultTime: '09:00',
  },
  {
    id: 'cooking',
    title: 'Cooking Time',
    description: 'Reminders to start preparing your meals',
    icon: Bell,
    defaultTime: '17:30',
  },
];

export default function Reminders() {
  const router = useRouter();
  const [enabledReminders, setEnabledReminders] = useState<string[]>([]);

  const toggleReminder = (id: string) => {
    setEnabledReminders(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleFinish = async () => {
    try {
      const reminders: MealReminder[] = REMINDER_TYPES.map(type => ({
        id: type.id,
        type: type.id as MealReminder['type'],
        enabled: enabledReminders.includes(type.id),
        time: type.defaultTime,
      }));

      await saveUserPreferences({
        meal_reminders: reminders
      });
      
      router.push('/(tabs)');
    } catch (error) {
      console.error('Error saving reminders:', error);
      // Continue anyway since we can sync later
      router.push('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.header}
      >
        <Text style={styles.title}>Set up reminders</Text>
        <Text style={styles.subtitle}>
          Never miss a meal prep or shopping day
        </Text>
      </Animated.View>

      <View style={styles.content}>
        {REMINDER_TYPES.map((reminder, index) => (
          <Animated.View
            key={reminder.id}
            entering={FadeInUp.delay(300 + index * 100).springify()}
          >
            <View style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <reminder.icon size={24} color="#2A9D8F" />
                <Switch
                  value={enabledReminders.includes(reminder.id)}
                  onValueChange={() => toggleReminder(reminder.id)}
                  trackColor={{ false: '#DDD', true: '#2A9D8F' }}
                  thumbColor="#fff"
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              </View>
              
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              <Text style={styles.reminderDescription}>{reminder.description}</Text>
              
              {enabledReminders.includes(reminder.id) && (
                <Animated.View 
                  entering={FadeInDown.springify()}
                  style={styles.timeContainer}
                >
                  <Text style={styles.timeLabel}>Reminder time</Text>
                  <Text style={styles.timeValue}>{reminder.defaultTime}</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View 
        entering={FadeInUp.delay(700).springify()}
        style={styles.footer}
      >
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
        >
          <Text style={styles.finishText}>Finish Setup</Text>
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
    padding: 24,
  },
  reminderCard: {
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
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 4,
  },
  reminderDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  timeContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  timeLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#2A9D8F',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  finishButton: {
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
  finishText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#fff',
    marginRight: 8,
  },
});