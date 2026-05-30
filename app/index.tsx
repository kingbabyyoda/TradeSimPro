// Powered by OnSpace.AI
import { Redirect } from 'expo-router';
import { usePortfolio } from '@/hooks/usePortfolio';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function RootIndex() {
  const { apiKey, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!apiKey) return <Redirect href={'/onboarding' as any} />;
  return <Redirect href="/(tabs)" />;
}
