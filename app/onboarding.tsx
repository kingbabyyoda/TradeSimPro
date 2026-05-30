// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [key, setKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setApiKey } = usePortfolio();
  const router = useRouter();

  const handleContinue = async () => {
    if (!key.trim()) return;
    setIsSubmitting(true);
    await setApiKey(key.trim());
    setIsSubmitting(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.heroContainer}>
          <Image
            source={require('@/assets/images/trading-hero.png')}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.heroOverlay} />
        </View>

        <View style={styles.content}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="trending-up" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>TradeSimPro</Text>
          </View>
          <Text style={styles.headline}>Paper Trading{'\n'}Simulator</Text>
          <Text style={styles.subtitle}>
            Practice trading with real market data. Start with $10,000 virtual cash. Zero risk, real experience.
          </Text>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>Polygon.io API Key</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={key}
                onChangeText={setKey}
                placeholder="Enter your API key..."
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!isVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setIsVisible(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                <Ionicons name={isVisible ? 'eye-off' : 'eye'} size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.hint}>
              Get your free API key at{' '}
              <Text style={styles.hintLink}>polygon.io</Text>
            </Text>
          </View>

          <View style={styles.featuresRow}>
            {[
              { icon: 'bar-chart', label: 'Live Data' },
              { icon: 'shield-checkmark', label: 'Paper Trading' },
              { icon: 'analytics', label: 'Charts & Analysis' },
            ].map(f => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={16} color={Colors.primary} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleContinue}
            disabled={!key.trim() || isSubmitting}
            style={({ pressed }) => [
              styles.ctaBtn,
              (!key.trim() || isSubmitting) && styles.ctaBtnDisabled,
              pressed && styles.ctaBtnPressed,
            ]}
          >
            <Text style={styles.ctaText}>{isSubmitting ? 'Setting up...' : 'Start Trading'}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1 },
  heroContainer: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,17,23,0.4)' },
  content: { flex: 1, padding: Spacing.xl, paddingTop: Spacing.lg },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  logoIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  appName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  headline: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: Spacing.sm, includeFontPadding: false, lineHeight: 40 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl, includeFontPadding: false },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
  inputLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, includeFontPadding: false },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: Spacing.sm },
  input: { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary },
  eyeBtn: { paddingHorizontal: Spacing.md },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, includeFontPadding: false },
  hintLink: { color: Colors.primary },
  featuresRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  featureItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  featureIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 16 },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },
});
