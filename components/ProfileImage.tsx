import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { fileExists } from '@/lib/image-utils';
import { getDefaultAvatarUrl } from '@/lib/profile';

interface ProfileImageProps {
  uri: string | null;
  username?: string;
  size?: number;
  style?: any;
}

export default function ProfileImage({ uri, username = 'User', size = 80, style = {} }: ProfileImageProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkImage = async () => {
      try {
        setLoading(true);
        
        // If no URI provided, use default avatar
        if (!uri) {
          setImageUri(getDefaultAvatarUrl(username));
          setLoading(false);
          return;
        }
        
        // Check if it's a local file and if it exists
        if (uri.startsWith('file://')) {
          const exists = await fileExists(uri);
          if (exists) {
            setImageUri(uri);
          } else {
            console.log('Local image file not found, using default avatar');
            setImageUri(getDefaultAvatarUrl(username));
          }
        } else {
          // For remote URLs, just use the URI directly
          setImageUri(uri);
        }
      } catch (error) {
        console.error('Error checking image:', error);
        setImageUri(getDefaultAvatarUrl(username));
      } finally {
        setLoading(false);
      }
    };
    
    checkImage();
  }, [uri, username]);

  if (loading) {
    return (
      <View 
        style={[
          styles.container, 
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      >
        <ActivityIndicator size="small" color="#2A9D8F" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri || getDefaultAvatarUrl(username) }}
      style={[
        styles.image,
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
      onError={() => setImageUri(getDefaultAvatarUrl(username))}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9ECEF',
    overflow: 'hidden',
  },
  image: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
