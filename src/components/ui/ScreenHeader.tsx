import { Platform, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';

/** Pull header slightly into the status-bar area (Ticketmaster pattern). */
const HEADER_TOP_OFFSET = Platform.OS === 'ios' ? 8 : 0;
const HEADER_ROW_HEIGHT = 44;

interface ScreenHeaderProps {
  title: string;
  right?: ReactNode;
  left?: ReactNode;
}

/**
 * Compact in-screen header used instead of the Expo native tab header.
 * Safe-area is applied once here so screens don't stack extra top whitespace.
 */
export function ScreenHeader({ title, right, left }: ScreenHeaderProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        paddingTop: Math.max(insets.top - HEADER_TOP_OFFSET, 0),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          minHeight: HEADER_ROW_HEIGHT,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {left ? (
          <View style={{ position: 'absolute', left: 16, zIndex: 1 }}>{left}</View>
        ) : null}
        <Text
          style={{
            ...typography.heading,
            color: colors.text,
            fontSize: 17,
            lineHeight: 22,
            fontWeight: '700',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {right ? (
          <View style={{ position: 'absolute', right: 16, zIndex: 1 }}>{right}</View>
        ) : null}
      </View>
    </View>
  );
}
