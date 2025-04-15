import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, UserPlus, Search } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Friends() {
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
        <Text style={styles.title}>Friends</Text>
      </Animated.View>

      <ScrollView style={styles.content}>
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.comingSoonContainer}
        >
          <Users size={64} color="#ADB5BD" />
          <Text style={styles.comingSoonTitle}>Social Features Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We're working on adding social features to help you connect with friends, 
            share meal plans, and compete in cooking challenges.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <UserPlus size={20} color="#2A9D8F" />
              <Text style={styles.featureText}>Add friends and build your cooking network</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Search size={20} color="#2A9D8F" />
              <Text style={styles.featureText}>Discover popular meal plans from other users</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Users size={20} color="#2A9D8F" />
              <Text style={styles.featureText}>Participate in group cooking challenges</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.notifyButton}
            onPress={() => router.back()}
          >
            <Text style={styles.notifyButtonText}>Back to Profile</Text>
          </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  comingSoonTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
    marginLeft: 12,
    flex: 1,
  },
  notifyButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  notifyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
