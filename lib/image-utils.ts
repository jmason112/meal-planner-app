import * as FileSystem from 'expo-file-system';

/**
 * Save an image from a URI to local file system
 * This is a more reliable approach than using Supabase storage
 */
export async function saveImageLocally(uri: string, userId: string): Promise<string | null> {
  try {
    console.log('Saving image locally, original URI:', uri.substring(0, 50) + '...');

    // Create a unique filename
    const fileName = `${userId}_avatar_${Date.now()}.jpg`;
    const fileUri = `${FileSystem.documentDirectory}images/${fileName}`;

    // Make sure the directory exists
    const dirUri = `${FileSystem.documentDirectory}images`;
    const dirInfo = await FileSystem.getInfoAsync(dirUri);
    if (!dirInfo.exists) {
      console.log('Creating images directory');
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }

    // Copy the file to our app's documents directory
    console.log('Copying file to:', fileUri);
    await FileSystem.copyAsync({
      from: uri,
      to: fileUri
    });

    console.log('File saved successfully');
    return fileUri;
  } catch (error) {
    console.error('Error saving image locally:', error);
    return null;
  }
}

/**
 * Get a locally stored image as a base64 string
 */
export async function getLocalImageAsBase64(fileUri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error reading local image:', error);
    return null;
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(fileUri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
}

/**
 * Delete a local file
 */
export async function deleteLocalFile(fileUri: string): Promise<boolean> {
  try {
    const exists = await fileExists(fileUri);
    if (exists) {
      await FileSystem.deleteAsync(fileUri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting local file:', error);
    return false;
  }
}
