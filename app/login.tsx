import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PenielLogo } from '@/src/components/brand/PenielLogo';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { useAuthStore, useAuthHydrated } from '@/src/stores/auth-store';
import { careHomeTabsHref } from '@/src/lib/care-home-home';
import { normalizeApiError } from '@/src/lib/api-client';
import { radius } from '@/src/theme/radius';
import { typography } from '@/src/theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(careHomeTabsHref(role));
    }
  }, [hydrated, isAuthenticated, role, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter your care home email and password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace(careHomeTabsHref(useAuthStore.getState().user?.role));
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    paddingHorizontal: 14,
    color: colors.text,
    ...typography.body,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          theme === 'dark'
            ? ['rgba(135,165,248,0.08)', 'transparent', 'rgba(167,139,250,0.06)']
            : ['rgba(37,99,235,0.06)', 'transparent', 'rgba(147,51,234,0.05)']
        }
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(500)} style={{ marginBottom: 28 }}>
            <PenielLogo size="md" showTagline tagline="HEALTHCARE AI" />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(550).delay(80)}
            style={[
              styles.card,
              {
                backgroundColor: theme === 'dark' ? 'rgba(11,17,32,0.92)' : 'rgba(255,255,255,0.92)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.primary,
                textTransform: 'uppercase',
                letterSpacing: 1.6,
              }}
            >
              Sign in
            </Text>
            <Text style={{ ...typography.title, color: colors.text, marginTop: 8 }}>
              Access your dashboard
            </Text>
            <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 6 }}>
              Enter your care home credentials to continue.
            </Text>

            <View style={{ marginTop: 24, gap: 16 }}>
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@carehome.co.uk"
                  placeholderTextColor={colors.secondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={inputStyle}
                />
              </View>

              <View>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.secondary}
                    secureTextEntry={!showPassword}
                    style={[inputStyle, { paddingRight: 48 }]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.secondary} />
                    ) : (
                      <Eye size={18} color={colors.secondary} />
                    )}
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => setRememberMe((prev) => !prev)}
                style={styles.rememberRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.border,
                      backgroundColor: rememberMe ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={{ ...typography.caption, color: colors.secondary }}>Remember me</Text>
              </Pressable>

              {error ? (
                <Text style={{ ...typography.caption, color: colors.status.critical }}>{error}</Text>
              ) : null}

              <AnimatedButton
                label={loading ? 'Signing in…' : 'Sign in'}
                onPress={handleSubmit}
                disabled={loading}
                size="lg"
              />

              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: -8 }} />
              ) : null}
            </View>

            <View style={[styles.footerNote, { borderTopColor: colors.border }]}>
              <ShieldCheck size={14} color={colors.secondary} />
              <Text style={{ ...typography.caption, color: colors.secondary, flex: 1 }}>
                Protected access for authorised PenielSense care homes only.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  label: {
    ...typography.label,
    marginBottom: 6,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
