import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Loader as Loader2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { signUp, signUpSchema, type SignUpForm, signIn } from '@/lib/auth';
import { saveUserPreferences } from '@/lib/preferences';
import { AuthError } from '@/components/AuthError';

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState<SignUpForm>({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Validate form data
      const validatedData = signUpSchema.parse(form);
      
      // Sign up user
      await signUp(validatedData);
      
      // Automatically sign in the user
      const { user } = await signIn({
        email: validatedData.email,
        password: validatedData.password
      });

      if (!user) {
        throw new Error('Failed to sign in after registration');
      }

      // Initialize user preferences with defaults
      await saveUserPreferences({
        dietary_preference: 'general',
        allergies: [],
        dislikes: [],
        servings: 2,
        meal_reminders: [
          {
            id: 'mealPlanning',
            type: 'mealPlanning',
            enabled: false,
            time: '18:00'
          },
          {
            id: 'shopping',
            type: 'shopping',
            enabled: false,
            time: '09:00'
          },
          {
            id: 'cooking',
            type: 'cooking',
            enabled: false,
            time: '17:30'
          }
        ]
      });
      
      // Redirect to preferences
      router.push('/preferences');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#264653" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Join SmartMealSaver to start your healthy eating journey
          </Text>
        </Animated.View>

        {error && <AuthError message={error} />}

        <Animated.View 
          entering={FadeInDown.delay(400).springify()}
          style={styles.form}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={(text) => setForm(prev => ({ ...prev, password: text }))}
              placeholder="Create a password"
              secureTextEntry
            />
            <Text style={styles.hint}>
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={24} color="#fff" style={styles.spinner} />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.signInLinkText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 32,
    color: '#264653',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  signUpButton: {
    backgroundColor: '#2A9D8F',
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
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  spinner: {
    alignSelf: 'center',
  },
  signInLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  signInLinkText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#2A9D8F',
  },
});