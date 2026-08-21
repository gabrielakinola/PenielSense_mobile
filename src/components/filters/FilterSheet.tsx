import { Modal, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useUiStore } from '@/src/stores/ui-store';
import { useHaptics } from '@/src/hooks/use-haptics';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

type FilterOption = { label: string; value: string };

interface FilterSheetProps {
  title: string;
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}

export function FilterSheet({
  title,
  options,
  selected,
  onSelect,
  onClear,
}: FilterSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { filterSheetOpen, setFilterSheetOpen } = useUiStore();
  const { selection } = useHaptics();

  return (
    <Modal
      visible={filterSheetOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setFilterSheetOpen(false)}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={() => setFilterSheetOpen(false)}
        accessibilityLabel="Close filter sheet"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surfaceElevated,
            borderTopLeftRadius: radius.card,
            borderTopRightRadius: radius.card,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ ...typography.heading, color: colors.text }}>{title}</Text>
            <Pressable
              onPress={() => setFilterSheetOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={22} color={colors.secondary} />
            </Pressable>
          </View>
          <View style={{ padding: 16, gap: 8 }}>
            {options.map((option) => {
              const isSelected = selected === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    selection();
                    onSelect(option.value);
                    setFilterSheetOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${option.label}`}
                  accessibilityState={{ selected: isSelected }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 14,
                    borderRadius: radius.button,
                    backgroundColor: isSelected ? `${colors.primary}15` : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    minHeight: MIN_TOUCH_TARGET,
                  }}
                >
                  <Text
                    style={{
                      ...typography.body,
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
                      }}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <AnimatedButton label="Clear filters" variant="ghost" onPress={onClear} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const RESIDENT_INTELLIGENCE_OPTIONS: FilterOption[] = [
  { label: 'Everyone', value: 'all' },
  { label: 'Needs a check', value: 'attention' },
  { label: 'Keep an eye on', value: 'watch' },
  { label: 'Off routine', value: 'delayed' },
  { label: 'Stable', value: 'clear' },
];

export const ALERT_SEVERITY_OPTIONS: FilterOption[] = [
  { label: 'All Severities', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
];

export const ALERT_STATUS_OPTIONS: FilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Resolved', value: 'resolved' },
];

