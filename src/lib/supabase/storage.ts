import { supabase } from './client';

export const uploadUserAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`; // Corrected: path within the 'avatars' bucket

    const { error: uploadError } = await supabase.storage
      .from('avatars') // This specifies the bucket
      .upload(`avatars/${filePath}`, file, { // Corrected: prepend 'avatars/' here for the folder structure
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
};
