import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Bell,
  Building2,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  Monitor,
} from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Card } from '@/src/components/ui/Card';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { ProfileMenuItem } from '@/src/components/profile/ProfileMenuItem';
import { useThemeStore } from '@/src/stores/theme-store';
import type { ThemeMode } from '@/src/theme/colors';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { getShadow } from '@/src/theme/shadows';
import { getInitials } from '@/src/utils/format';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { useAuthStore } from '@/src/stores/auth-store';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const careHome = useAuthStore((s) => s.careHome);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const themeLabel = THEME_OPTIONS.find((t) => t.mode === mode)?.label ?? 'System';
  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'Care staff';
  const roleLabel = user?.role ?? 'Staff';
  const email = user?.email ?? '';
  const careHomeName = careHome?.name ?? 'Care home';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Profile" />
      <ScreenContainer>
        <Animated.View entering={FadeInDown.duration(420).springify().damping(18)}>
          <View
            style={[
              {
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                padding: 20,
                overflow: 'hidden',
                marginBottom: 20,
              },
              getShadow(theme, 'elevated'),
            ]}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -48,
                right: -32,
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor:
                  theme === 'dark'
                    ? 'rgba(135,165,248,0.16)'
                    : 'rgba(37,99,235,0.12)',
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: -40,
                left: 24,
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor:
                  theme === 'dark'
                    ? 'rgba(34,211,238,0.08)'
                    : 'rgba(6,182,212,0.08)',
              }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...typography.title, color: '#FFFFFF' }}>
                  {getInitials(user?.firstName ?? 'C', user?.lastName ?? 'S')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.title, color: colors.text }}>
                  {displayName}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                    marginTop: 4,
                  }}
                >
                  {roleLabel}
                </Text>
                {email ? (
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.secondary,
                      marginTop: 2,
                    }}
                  >
                    {email}
                  </Text>
                ) : null}
              </View>
            </View>

            <View
              style={{
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor:
                  theme === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(248,250,252,0.95)',
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Building2 size={16} color={colors.primary} />
              <Text style={{ ...typography.caption, color: colors.text, flex: 1 }}>
                {careHomeName}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Text
          style={{
            ...typography.caption,
            color: colors.secondary,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Account
        </Text>
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
          <ProfileMenuItem icon={Settings} label="Account Settings" />
          <View
            style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }}
          />
          <ProfileMenuItem icon={Bell} label="Notifications" value="On" />
          <View
            style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }}
          />
          <ProfileMenuItem icon={Shield} label="Privacy & Security" />
          <View
            style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }}
          />
          <ProfileMenuItem icon={HelpCircle} label="Help & Support" />
        </Card>

        <Text
          style={{
            ...typography.caption,
            color: colors.secondary,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Appearance
        </Text>
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          {THEME_OPTIONS.map((option, index) => (
            <View key={option.mode}>
              {index > 0 ? (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginHorizontal: 16,
                  }}
                />
              ) : null}
              <ProfileMenuItem
                icon={option.icon}
                label={option.label}
                value={mode === option.mode ? '✓' : undefined}
                onPress={() => setMode(option.mode)}
              />
            </View>
          ))}
        </Card>

        <Text
          style={{
            ...typography.label,
            color: colors.secondary,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Current theme: {themeLabel}
        </Text>

        <AnimatedButton
          label="Log Out"
          variant="danger"
          onPress={() => {
            logout();
            router.replace('/login');
          }}
          accessibilityLabel="Log out"
        />
      </ScreenContainer>
    </View>
  );
}
