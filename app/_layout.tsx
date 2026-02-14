import React, { useEffect, useState } from 'react';
import { getAccessToken, getRefreshToken } from '@/hooks/Storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser } from '@/hooks/useUser';
const queryClient = new QueryClient();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppNavigator />
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

function AppNavigator() {
  const [hasTokens, setHasTokens] = useState<boolean | null>(null); // null = checking
  const [loadAuth, setLoadAuth] = useState(false);

  // First, check if tokens exist
  useEffect(() => {
    checkTokens();
  }, []);

  const checkTokens = async () => {
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      setHasTokens(!!(accessToken || refreshToken));
    } catch (error) {
      console.error('[AUTH] Error checking tokens:', error);
      setHasTokens(false);
    }
  };

  const { data, isLoading } = useUser({
    enabled: hasTokens === true,
  });
  useEffect(() => {
    if (isLoading === false) {
      setLoadAuth(true);
    }
    if (!hasTokens) {
      setLoadAuth(true);
    }
    console.log('loadAuth', loadAuth);
  }, [isLoading, hasTokens]);

  return (
    <React.Fragment>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'black' },
        }}
      ></Stack>
      <Stack.Protected guard={loadAuth}>
        <Stack.Screen name="(hero)" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={data !== undefined}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(account)" options={{ headerShown: false }} />
        <Stack.Screen name="(add-exercise)" />
        <Stack.Screen name="(active-workout)" />
        <Stack.Screen name="(add-workout)" />
        <Stack.Screen name="(exercise-statistics)" />
        <Stack.Screen name="(templates)" />
        <Stack.Screen name="(volume-analysis)" />
        <Stack.Screen name="(recovery-status)" />
      </Stack.Protected>
    </React.Fragment>
  );
}
