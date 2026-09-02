import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  HeartHandshake,
  MessageCircle,
  ShieldAlert,
  UserRound,
} from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import type { ResidentCareProfileDto } from '@/src/types/carehome.types';

interface Props {
  profile?: ResidentCareProfileDto;
  isLoading: boolean;
}

export function ResidentAtAGlance({ profile, isLoading }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  if (isLoading) return <SkeletonCard lines={4} />;

  const highRisks = (profile?.risks ?? []).filter(
    (risk) => risk.level === 'HIGH' || risk.level === 'CRITICAL',
  );
  const hasCritical = (profile?.allergies.length ?? 0) > 0 || highRisks.length > 0;
  const rows = [
    { icon: MessageCircle, label: 'Communication', value: profile?.communicationNeeds },
    { icon: HeartHandshake, label: 'How to support', value: profile?.aboutMe?.howToSupportMe },
    { icon: UserRound, label: 'Mobility', value: profile?.mobilitySupport },
  ].filter((row) => row.value?.trim());

  return (
    <View style={{ marginBottom: 16 }}>
      <SectionHeader title="At a glance" />
      <Card
        style={{
          padding: 0,
          overflow: 'hidden',
          borderColor: hasCritical ? colors.status.critical : colors.border,
        }}
      >
        <View
          style={{
            height: 4,
            backgroundColor: hasCritical ? colors.status.critical : colors.primary,
          }}
        />
        <View style={{ padding: 16, gap: 14 }}>
          {!profile?.id ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <AlertTriangle size={20} color={colors.status.watch} />
              <Text style={{ ...typography.caption, color: colors.secondary, flex: 1 }}>
                The manager has not completed this resident’s care profile yet.
              </Text>
            </View>
          ) : null}

          {profile?.allergies.length ? (
            <View
              accessibilityLabel={`Allergies: ${profile.allergies.join(', ')}`}
              style={{
                padding: 12,
                borderRadius: radius.md,
                backgroundColor: colors.statusBg.critical,
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <ShieldAlert size={20} color={colors.status.critical} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.label, color: colors.status.critical, fontWeight: '700' }}>
                  ALLERGIES
                </Text>
                <Text style={{ ...typography.bodyMedium, color: colors.text, marginTop: 2 }}>
                  {profile.allergies.join(' · ')}
                </Text>
              </View>
            </View>
          ) : null}

          {highRisks.map((risk) => (
            <View key={`${risk.title}-${risk.level}`} style={{ gap: 3 }}>
              <Text style={{ ...typography.label, color: colors.status.critical, fontWeight: '700' }}>
                {risk.level} RISK · {risk.title.toUpperCase()}
              </Text>
              <Text style={{ ...typography.caption, color: colors.text }}>{risk.controls}</Text>
            </View>
          ))}

          {rows.map(({ icon: Icon, label, value }) => (
            <View key={label} style={{ flexDirection: 'row', gap: 10 }}>
              <Icon size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.label, color: colors.secondary }}>{label}</Text>
                <Text style={{ ...typography.caption, color: colors.text, marginTop: 2 }}>{value}</Text>
              </View>
            </View>
          ))}
          {profile?.residentId ? (
            <Pressable
              onPress={() => router.push(`/residents/${profile.residentId}/care-plan`)}
              accessibilityRole="button"
              accessibilityLabel="Open care plan"
              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary }}
            >
              <Text style={{ ...typography.bodyMedium, color: colors.primary }}>Open care plan</Text>
            </Pressable>
          ) : null}
        </View>
      </Card>
    </View>
  );
}
