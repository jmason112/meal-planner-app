import { supabase } from './supabase';
import { saveImageLocally, fileExists } from './image-utils';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  social_links: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface LevelInfo {
  currentLevel: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number; // 0-100 percentage to next level
  totalXpForNextLevel: number;
}

/**
 * Get the current user's profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found, create a default one
        console.log('No profile found, creating default profile');
        return createDefaultUserProfile();
      }
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return null;
  }
}

/**
 * Get a user profile by user ID
 */
export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile by ID:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getUserProfileById:', err);
    return null;
  }
}

/**
 * Get a user profile by username
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Error fetching user profile by username:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getUserProfileByUsername:', err);
    return null;
  }
}

/**
 * Create a default user profile for the current user
 */
export async function createDefaultUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    // First check if a profile already exists for this user
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If profile exists, return it
    if (existingProfile) {
      console.log('User profile already exists, returning existing profile');
      return existingProfile;
    }

    // If there was an error other than 'not found', log it
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing profile:', checkError);
      return null;
    }

    // Generate a unique username based on user metadata, name, or email
    let username = '';
    if (user.user_metadata?.username) {
      // Use the username from metadata if available
      username = user.user_metadata.username;
    } else if (user.user_metadata?.name) {
      // Convert name to lowercase, replace spaces with underscores, and add random digits
      username = `${user.user_metadata.name.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000)}`;
    } else if (user.email) {
      // Use the part before @ in the email
      username = user.email.split('@')[0];
    } else {
      // Fallback to a random username
      username = `user_${Math.floor(Math.random() * 10000)}`;
    }

    const defaultProfile = {
      user_id: user.id,
      username,
      bio: null,
      avatar_url: null,
      level: 1,
      xp: 0,
      social_links: {}
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(defaultProfile)
      .select()
      .single();

    if (error) {
      console.error('Error creating default user profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createDefaultUserProfile:', err);
    return null;
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    return null;
  }
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile found with this username, so it's available
      return true;
    }

    // If we found a profile with this username, it's not available
    return false;
  } catch (err) {
    console.error('Error checking username availability:', err);
    return false;
  }
}

/**
 * Add XP to the current user's profile
 */
export async function addUserXp(xpAmount: number): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    // Get current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching current profile:', profileError);
      return null;
    }

    // Calculate new XP
    const newXp = (currentProfile.xp || 0) + xpAmount;

    // Update profile with new XP
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        xp: newXp,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user XP:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in addUserXp:', err);
    return null;
  }
}

/**
 * Get level information for a user
 */
export async function getLevelInfo(userId?: string): Promise<LevelInfo | null> {
  try {
    let profile: UserProfile | null;

    if (userId) {
      profile = await getUserProfileById(userId);
    } else {
      profile = await getUserProfile();
    }

    if (!profile) {
      return null;
    }

    // Call the Supabase function to get XP needed for next level
    const { data, error } = await supabase.rpc('xp_for_next_level', {
      current_level: profile.level
    });

    if (error) {
      console.error('Error getting XP for next level:', error);
      return null;
    }

    const xpForNextLevel = data;

    // Calculate progress percentage
    const baseXpForCurrentLevel = profile.xp - calculateTotalXpForLevel(profile.level - 1);
    const progress = Math.min(100, Math.floor((baseXpForCurrentLevel / xpForNextLevel) * 100));

    return {
      currentLevel: profile.level,
      currentXp: profile.xp,
      xpForNextLevel,
      progress,
      totalXpForNextLevel: calculateTotalXpForLevel(profile.level) + xpForNextLevel
    };
  } catch (err) {
    console.error('Error in getLevelInfo:', err);
    return null;
  }
}

/**
 * Calculate total XP required to reach a specific level
 */
function calculateTotalXpForLevel(level: number): number {
  if (level <= 0) return 0;

  const baseXp = 100;
  const growthFactor = 1.5;
  let totalXp = 0;

  for (let i = 1; i < level; i++) {
    totalXp += Math.floor(baseXp * Math.pow(growthFactor, i - 1));
  }

  return totalXp;
}

/**
 * Initialize the profiles storage bucket if it doesn't exist
 *
 * Note: This function assumes the bucket has already been created in the Supabase dashboard
 * as creating buckets programmatically requires admin privileges that the client doesn't have.
 */
export async function initializeProfileStorage(): Promise<boolean> {
  try {
    // We'll just check if we can access the bucket
    // This will tell us if it exists and if we have the right permissions
    const { data, error } = await supabase.storage
      .from('avatars')
      .list();

    if (error) {
      // If we get a 404, the bucket doesn't exist
      if (error.message.includes('The resource was not found') ||
          error.message.includes('bucket not found')) {
        console.log('Avatars bucket not found - using default avatars only');
        // We'll return true anyway and just use default avatars
        return true;
      }

      console.error('Error accessing avatars bucket:', error);
      return false;
    }

    console.log('Successfully accessed avatars bucket');
    return true;
  } catch (err) {
    console.error('Error initializing profile storage:', err);
    return false;
  }
}

/**
 * Upload a profile avatar image
 * This uses local file storage instead of Supabase storage to avoid issues
 */
export async function uploadProfileAvatar(uri: string): Promise<string | null> {
  try {
    console.log('Starting profile avatar upload process');
    console.log('Image URI:', uri.substring(0, 50) + '...');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    console.log('User authenticated:', user.id);

    // Save the image locally
    const localImageUri = await saveImageLocally(uri, user.id);

    if (!localImageUri) {
      console.error('Failed to save image locally');
      // Fall back to default avatar
      const defaultAvatarUrl = getDefaultAvatarUrl(user.user_metadata?.username || user.user_metadata?.name || 'User');
      await updateUserProfile({ avatar_url: defaultAvatarUrl });
      return defaultAvatarUrl;
    }

    console.log('Image saved locally at:', localImageUri);

    // Update the user profile with the local image URI
    await updateUserProfile({ avatar_url: localImageUri });

    return localImageUri;

    /* Commenting out the problematic code for now
    // Check if we can access storage
    const bucketInitialized = await initializeProfileStorage();
    console.log('Storage bucket initialized:', bucketInitialized);

    // If we can't access storage, just use a default avatar URL
    if (!bucketInitialized) {
      console.log('Using default avatar as storage is not available');
      const defaultAvatarUrl = getDefaultAvatarUrl(user.user_metadata?.username || user.user_metadata?.name || 'User');
      await updateUserProfile({ avatar_url: defaultAvatarUrl });
      return defaultAvatarUrl;
    }

    try {
      // Create a unique file name
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      console.log('File path for upload:', filePath);

      console.log('Fetching image from URI...');
      // Convert image to blob
      const response = await fetch(uri);
      console.log('Fetch response status:', response.status);
      const blob = await response.blob();
      console.log('Blob size:', blob.size);

      console.log('Uploading to Supabase Storage...');
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        // Fall back to default avatar
        const defaultAvatarUrl = getDefaultAvatarUrl(user.user_metadata?.username || user.user_metadata?.name || 'User');
        await updateUserProfile({ avatar_url: defaultAvatarUrl });
        return defaultAvatarUrl;
      }

      console.log('Upload successful, getting public URL...');
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      // Update the user profile with the new avatar URL
      await updateUserProfile({ avatar_url: publicUrl });

      return publicUrl;
    } catch (uploadError) {
      console.error('Error in avatar upload process:', uploadError);
      // Fall back to default avatar
      const defaultAvatarUrl = getDefaultAvatarUrl(user.user_metadata?.username || user.user_metadata?.name || 'User');
      await updateUserProfile({ avatar_url: defaultAvatarUrl });
      return defaultAvatarUrl;
    }
    */
  } catch (err) {
    console.error('Error in uploadProfileAvatar:', err);
    // Fall back to default avatar in case of any error
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const defaultAvatarUrl = getDefaultAvatarUrl(user.user_metadata?.username || user.user_metadata?.name || 'User');
        await updateUserProfile({ avatar_url: defaultAvatarUrl });
        return defaultAvatarUrl;
      }
    } catch (fallbackError) {
      console.error('Error in fallback avatar generation:', fallbackError);
    }
    return null;
  }
}

/**
 * Generate a default avatar URL based on username
 */
export function getDefaultAvatarUrl(username: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2A9D8F&color=fff`;
}
