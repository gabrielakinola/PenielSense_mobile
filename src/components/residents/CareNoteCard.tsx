import { Alert, Pressable, Text, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';
import { formatRelativeTime } from '@/src/utils/format';
import {
  careEntryCategoryLabel,
  type CareEntryDto,
} from '@/src/types/care-entry.types';

interface CareNoteCardProps {
  entry: CareEntryDto;
  canMutate?: boolean;
  isEditing?: boolean;
  onEdit?: (entry: CareEntryDto) => void;
  onDelete?: (entry: CareEntryDto) => void;
}

export function CareNoteCard({
  entry,
  canMutate = false,
  isEditing = false,
  onEdit,
  onDelete,
}: CareNoteCardProps) {
  const colors = useThemeColors();
  const confirmer =
    `${entry.confirmedBy.firstName} ${entry.confirmedBy.lastName}`.trim();
  const editor = entry.lastEditedBy
    ? `${entry.lastEditedBy.firstName} ${entry.lastEditedBy.lastName}`.trim()
    : '';

  const confirmDelete = () => {
    Alert.alert('Delete this note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(entry),
      },
    ]);
  };

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: isEditing ? colors.primary : colors.border,
        backgroundColor: isEditing ? `${colors.primary}12` : 'transparent',
        padding: 12,
        gap: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Text
          style={{
            ...typography.caption,
            color: colors.secondary,
            flex: 1,
          }}
        >
          {formatRelativeTime(entry.confirmedAt)}
          {confirmer ? ` · ${confirmer}` : ''}
          {entry.lastEditedAt
            ? ` · edited ${formatRelativeTime(entry.lastEditedAt)}${editor ? ` by ${editor}` : ''}`
            : ''}
        </Text>
        {canMutate ? (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Pressable
              onPress={() => onEdit?.(entry)}
              accessibilityRole="button"
              accessibilityLabel="Edit note"
              style={{
                minHeight: MIN_TOUCH_TARGET,
                minWidth: MIN_TOUCH_TARGET,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pencil size={16} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete note"
              style={{
                minHeight: MIN_TOUCH_TARGET,
                minWidth: MIN_TOUCH_TARGET,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={16} color={colors.status.critical} />
            </Pressable>
          </View>
        ) : null}
      </View>
      <Text style={{ ...typography.caption, color: colors.text }}>
        {entry.rawText}
      </Text>
      {entry.confirmedItems.map((item, index) => (
        <Text
          key={`${entry.id}-${item.category}-${index}`}
          style={{ ...typography.caption, color: colors.text }}
        >
          <Text style={{ fontWeight: '600' }}>
            {careEntryCategoryLabel(item.category)}
          </Text>
          {' — '}
          {item.summary}
        </Text>
      ))}
    </View>
  );
}
