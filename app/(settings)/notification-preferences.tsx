import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function NotificationPreferences() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.delay(100)}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#264653" />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Bell size={20} color="#264653" />
                <Text style={styles.settingTitle}>Enable Notifications</Text>
              </View>
              <Text style={styles.settingDescription}>Receive notifications about your meal plans</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonTitle}>More notification settings coming soon!</Text>
            <Text style={styles.comingSoonText}>We're working on adding more notification options to help you stay on track with your meal planning.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#264653',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#264653',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#264653',
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 28,
  },
  comingSoonContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F0F9F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A9D8F',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A9D8F',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#264653',
    lineHeight: 20,
  },
});
