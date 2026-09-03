import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ChevronRight, MessageSquareText } from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
import { IntelligenceStatusChip } from '@/src/components/residents/IntelligenceStatusChip';
import { listItemEnter } from '@/src/animations/presets';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import type { HandoverResidentCard } from '@/src/types/carehome.types';
import type { IntelligenceStatusTone } from '@/src/utils/resident-status';

function riskTone(
  risk: HandoverResidentCard['riskLevel'],
): { label: string; tone: IntelligenceStatusTone; accentKey: 'critical' | 'watch' | 'good' } {
  if (risk === 'attention') {
    return { label: 'Needs a check', tone: 'attention', accentKey: 'critical' };
  }
  if (risk === 'watch') {
    return { label: 'Keep an eye on', tone: 'watch', accentKey: 'watch' };
  }
  return { label: 'Stable', tone: 'stable', accentKey: 'good' };
}

interface HandoverResidentRowProps {
  resident: HandoverResidentCard;
  index: number;
  onPress: () => void;
}

export function HandoverResidentRow({
  resident,
  index,
  onPress,
}: HandoverResidentRowProps) {
  const colors = useThemeColors();
  const status = riskTone(resident.riskLevel);
  const accent = colors.status[status.accentKey];

  return (
    <Animated.View entering={listItemEnter(index)} style={{ marginBottom: 12 }}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 4, backgroundColor: accent }} />
            <View style={{ flex: 1, padding: 14 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                    {resident.residentName}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.secondary,
                      marginTop: 2,
                    }}
                  >
                    {resident.room}
                    {resident.connectedDevices.length
                      ? ` · ${resident.connectedDevices.join(', ')}`
                      : ''}
                  </Text>
                </View>
                <IntelligenceStatusChip label={status.label} tone={status.tone} />
              </View>
              <Text
                style={{
                  ...typography.body,
                  color: colors.text,
                  marginTop: 10,
                  lineHeight: 21,
                }}
              >
                {resident.summary}
              </Text>
              {resident.reviewFlags.length > 0 ? (
                <Text
                  style={{
                    ...typography.label,
                    color: colors.status.watch,
                    marginTop: 8,
                  }}
                >
                  {resident.reviewFlags.length} open flag
                  {resident.reviewFlags.length === 1 ? '' : 's'}
                </Text>
              ) : null}
              {(resident.handoverNotes ?? []).map((note) => (
                <View key={note.id} style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: colors.statusBg.watch, flexDirection: 'row', gap: 8 }}>
                  <MessageSquareText size={17} color={colors.status.watch} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.label, color: colors.status.watch, fontWeight: '700' }}>STAFF HANDOVER NOTE</Text>
                    <Text style={{ ...typography.caption, color: colors.text, marginTop: 3 }}>{note.summary}</Text>
                    <Text style={{ ...typography.label, color: colors.secondary, marginTop: 4 }}>{note.recordedBy}</Text>
                  </View>
                </View>
              ))}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginTop: 8,
                }}
              >
                <ChevronRight size={16} color={colors.secondary} />
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
