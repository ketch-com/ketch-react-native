import { KetchServiceProvider, LogLevel } from '@ketch-com/ketch-react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import SharedPreferences from '@/utils/SharedPreferences';
import { wrapSharedPreferences } from '@ketch-com/ketch-react-native';
import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const onEnvironmentUpdated = (data: string) => {
    console.log('onEnvironmentUpdated', JSON.stringify(data));
  };

  const onRegionUpdated = (data: string) => {
    console.log('onRegionUpdated', JSON.stringify(data));
  };

  const onJurisdictionUpdated = (data: string) => {
    console.log('onJurisdictionUpdated', JSON.stringify(data));
  };

  const onIdentitiesUpdated = (data: Record<string, string>) => {
    console.log('onIdentitiesUpdated', JSON.stringify(data));
  };

  const onConsentUpdated = (data: Record<string, any>) => {
    console.log('onConsentUpdated', JSON.stringify(data));
  };

  const onPrivacyProtocolUpdated = (
    key: string,
    array: (string | Record<string, string>)[],
  ) => {
    console.log('onPrivacyProtocolUpdated:key', key);
    console.log('onPrivacyProtocolUpdated:array', array);
  };

  const onError = (errorMsg: string) => {
    console.log(errorMsg);
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <KetchServiceProvider
      organizationCode="ketch_samples"
      propertyCode="react_native_sample_app"
      identities={{email: 'test@ketch.com'}}
      onEnvironmentUpdated={onEnvironmentUpdated}
      onRegionUpdated={onRegionUpdated}
      onJurisdictionUpdated={onJurisdictionUpdated}
      onIdentitiesUpdated={onIdentitiesUpdated}
      onConsentUpdated={onConsentUpdated}
      onPrivacyProtocolUpdated={onPrivacyProtocolUpdated}
      onError={onError}
      logLevel={LogLevel.TRACE}
      preferenceStorage={Platform.OS === 'android' ? wrapSharedPreferences(SharedPreferences) : undefined}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </KetchServiceProvider>
  );
}
