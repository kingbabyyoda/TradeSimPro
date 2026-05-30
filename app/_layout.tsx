// Powered by OnSpace.AI
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PortfolioProvider } from '@/contexts/PortfolioContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <PortfolioProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D1117' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="stock/[symbol]"
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0D1117' },
                headerTintColor: '#E6EDF3',
                headerTitleStyle: { fontWeight: '700', fontSize: 17 },
                headerShadowVisible: false,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
        </PortfolioProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
