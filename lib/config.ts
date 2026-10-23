function isRealConfiguration(value: string | undefined) {
  return Boolean(value && !/YOUR_|PLACEHOLDER|EXAMPLE/i.test(value));
}

export const isSupabaseConfigured = Boolean(
  isRealConfiguration(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isRealConfiguration(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

export const isLiveKitClientConfigured = isRealConfiguration(process.env.NEXT_PUBLIC_LIVEKIT_URL);

export const isLiveKitConfigured = Boolean(
  isLiveKitClientConfigured &&
    isRealConfiguration(process.env.LIVEKIT_API_KEY) &&
    isRealConfiguration(process.env.LIVEKIT_API_SECRET),
);

export const appName = "Kheewar";
