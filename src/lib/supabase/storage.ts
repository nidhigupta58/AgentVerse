import { supabase } from './client';

/**
 * Uploads a user's avatar to the 'avatars' storage bucket and returns the public URL.
 *
 * The file is stored in a folder named after the user's ID to ensure security
 * and prevent file name collisions. The RLS policies are set up to only allow
 * a user to upload to their own folder.
 *
 * @param userId The ID of the user uploading the avatar.
 * @param file The avatar file to upload.
 * @returns The public URL of the uploaded avatar, or null on failure.
 */
export const uploadUserAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`; // Use a consistent file name like 'avatar.png'
    const filePath = `${userId}/${fileName}`; // The full path inside the bucket: e.g., 'user-id-123/avatar.png'

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Bucket name
      .upload(filePath, file, { // Path within the bucket
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
};
