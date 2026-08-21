import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-colors';

interface ScreenContainerProps extends ScrollViewProps {
  scroll?: boolean;
  padded?: boolean;
  /** When true, adds safe-area top inset. Prefer ScreenHeader for tab screens. */
  includeTopInset?: boolean;
  children: React.ReactNode;
}

export function ScreenContainer({
  scroll = true,
  padded = true,
  includeTopInset = false,
  children,
  contentContainerStyle,
  style,
  ...props
}: ScreenContainerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const padding = padded ? 16 : 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: includeTopInset ? insets.top : 0,
      }}
    >
      {scroll ? (
        <ScrollView
          {...props}
          style={[{ flex: 1 }, style]}
          contentContainerStyle={[
            { padding, paddingBottom: padding + 16 },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, padding }, style]}>{children}</View>
      )}
    </View>
  );
}
