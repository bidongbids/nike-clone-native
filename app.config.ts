export default {
  expo: {
    name: 'Nike Clone',
    slug: 'nike-clone-native',
    version: '1.0.0',
    sdkVersion: '52.0.0',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
}