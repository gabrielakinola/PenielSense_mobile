import { TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { radius } from '@/src/theme/radius';
import { typography } from '@/src/theme/typography';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  accessibilityLabel = 'Search',
}: SearchInputProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.button,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        minHeight: MIN_TOUCH_TARGET,
      }}
    >
      <Search size={18} color={colors.secondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        accessibilityLabel={accessibilityLabel}
        style={{
          flex: 1,
          marginLeft: 8,
          ...typography.body,
          color: colors.text,
          paddingVertical: 10,
        }}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} color={colors.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
