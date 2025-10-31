import { testApiKey } from '@/app/actions';

// Test function untuk validasi API key
export async function validateApiKey() {
  try {
    const result = await testApiKey();
    return result;
  } catch (error) {
    return { error: 'API key validation failed', details: error };
  }
}