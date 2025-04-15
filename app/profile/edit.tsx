import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, X, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { getUserProfile, updateUserProfile, isUsernameAvailable, uploadProfileAvatar } from '@/lib/profile';
import ProfileImage from '@/components/ProfileImage';

export default function EditProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [newAvatarUri, setNewAvatarUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile();

      if (userProfile) {
        // No need to verify avatar URL here anymore - ProfileImage component will handle it

        setProfile(userProfile);
        setUsername(userProfile.username || '');
        setBio(userProfile.bio || '');
        setAvatarUri(userProfile.avatar_url || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = async (text) => {
    setUsername(text);

    // Basic validation
    if (text.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setUsernameAvailable(false);
      return;
    }

    // Check if username is different from current
    if (profile && text === profile.username) {
      setUsernameError('');
      setUsernameAvailable(true);
      return;
    }

    // Check availability
    const available = await isUsernameAvailable(text);
    setUsernameAvailable(available);
    setUsernameError(available ? '' : 'Username is already taken');
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select a profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          // Show loading indicator
          setSaving(true);

          // Set the new avatar URI for preview
          setNewAvatarUri(result.assets[0].uri);

          // Hide loading indicator after a short delay
          setTimeout(() => {
            setSaving(false);
          }, 500);
        } catch (previewError) {
          console.error('Error setting preview image:', previewError);
          setSaving(false);
          Alert.alert('Error', 'Failed to preview image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setSaving(false);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          // Show loading indicator
          setSaving(true);

          // Set the new avatar URI for preview
          setNewAvatarUri(result.assets[0].uri);

          // Hide loading indicator after a short delay
          setTimeout(() => {
            setSaving(false);
          }, 500);
        } catch (previewError) {
          console.error('Error setting preview image:', previewError);
          setSaving(false);
          Alert.alert('Error', 'Failed to preview image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setSaving(false);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = () => {
    setNewAvatarUri(null);
    if (profile && profile.avatar_url) {
      // If removing an existing avatar, confirm with the user
      Alert.alert(
        'Remove Profile Photo',
        'Are you sure you want to remove your profile photo?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => setAvatarUri(null),
          },
        ]
      );
    }
  };

  const handleSave = async () => {
    try {
      // Validate username
      if (!username) {
        Alert.alert('Error', 'Username is required');
        return;
      }

      if (!usernameAvailable) {
        Alert.alert('Error', usernameError || 'Username is not available');
        return;
      }

      setSaving(true);

      // Upload new avatar if selected
      let avatarUrl = avatarUri;
      if (newAvatarUri) {
        try {
          console.log('Uploading new avatar...');
          avatarUrl = await uploadProfileAvatar(newAvatarUri);
          console.log('Avatar upload result:', avatarUrl);

          if (!avatarUrl) {
            console.log('No avatar URL returned, using default');
            Alert.alert('Warning', 'Failed to upload profile photo, but other changes will be saved.');
          }
        } catch (avatarError) {
          console.error('Error in avatar upload:', avatarError);
          Alert.alert('Warning', 'Failed to upload profile photo, but other changes will be saved.');
        }
      } else if (avatarUri === null && profile && profile.avatar_url) {
        // User removed their avatar
        avatarUrl = null;
      }

      console.log('Updating profile with avatar URL:', avatarUrl);

      // Update profile
      const updatedProfile = await updateUserProfile({
        username,
        bio,
        avatar_url: avatarUrl,
      });

      if (updatedProfile) {
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, (!usernameAvailable || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!usernameAvailable || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Check size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content}>
        {/* Profile Photo Section */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.photoSection}
        >
          <View style={styles.profileImageContainer}>
            <ProfileImage
              uri={newAvatarUri || avatarUri}
              username={username || 'User'}
              size={120}
              style={styles.profileImage}
            />

            {(newAvatarUri || avatarUri) && (
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={removePhoto}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={pickImage}
            >
              <Text style={styles.photoButtonText}>Choose Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={takePhoto}
            >
              <Camera size={16} color="#2A9D8F" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Username Section */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.formSection}
        >
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[
              styles.input,
              usernameError ? styles.inputError : null
            ]}
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="Enter a unique username"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : (
            <Text style={styles.helperText}>
              This will be your unique identifier in the app
            </Text>
          )}
        </Animated.View>

        {/* Bio Section */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.formSection}
        >
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about yourself"
            multiline
            maxLength={150}
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </Animated.View>

        {/* Social Links Section - Placeholder for future */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.formSection}
        >
          <Text style={styles.label}>Social Links</Text>
          <Text style={styles.comingSoonText}>
            Social media integration coming soon!
          </Text>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A9D8F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#2A9D8F',
  },
  removePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E76F51',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A9D8F',
  },
  photoButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2A9D8F',
    marginLeft: 8,
  },
  formSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#264653',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#495057',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#E76F51',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#E76F51',
    marginBottom: 8,
  },
  helperText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 8,
  },
  charCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
  },
  comingSoonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});
