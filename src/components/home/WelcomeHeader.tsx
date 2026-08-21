import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { User } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { getFirstName, getGreeting } from '@/src/utils/greeting';
import { getInitials } from '@/src/utils/format';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

interface WelcomeHeaderProps {
  user: User;
}

export function WelcomeHeader({ user }: WelcomeHeaderProps) {
  const colors = useThemeColors();
  const greeting = getGreeting();
  const firstName = getFirstName(user.name);

  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radius.card,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(255,255,255,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...typography.heading, color: '#FFFFFF' }}>
            {getInitials(user.name.split(' ')[0] ?? 'S', user.name.split(' ')[1] ?? 'M')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.85)' }}>
            {greeting},
          </Text>
          <Text style={{ ...typography.title, color: '#FFFFFF' }}>{firstName}</Text>
          <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
            {user.careHome}
          </Text>
          <Text style={{ ...typography.label, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            {user.shift}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
