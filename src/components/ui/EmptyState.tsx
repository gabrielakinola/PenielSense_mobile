import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { AnimatedButton } from './AnimatedButton';
import { typography } from '@/src/theme/typography';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View
      accessibilityLabel={title}
      style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: `${colors.primary}15`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={28} color={colors.primary} />
      </View>
      <Text style={{ ...typography.heading, color: colors.text, textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            ...typography.caption,
            color: colors.secondary,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <AnimatedButton label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}
