import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, ChevronRight, LogOut } from 'lucide-react-native';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // First clear the Supabase session
      await supabase.auth.signOut();
      
      // Then clear any local auth state
      await signOut();
      
      // Finally, redirect to the welcome screen
      router.replace('/(onboarding)');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(settings)/preferences')}
          >
            <View style={styles.menuItemContent}>
              <Settings size={20} color="#2A9D8F" />
              <Text style={styles.menuItemText}>Preferences</Text>
            </View>
            <ChevronRight size={20} color="#ADB5BD" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#E76F51" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#264653',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3F0',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  signOutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#E76F51',
    marginLeft: 8,
  },
});