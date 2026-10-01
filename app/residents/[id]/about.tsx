import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { HeartHandshake, MessageCircle, Phone, ShieldAlert, Stethoscope, UserRound } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { ResidentWorkspaceHeader } from '@/src/components/residents/ResidentWorkspaceHeader';
import { getCareHomeResidentById, getResidentCareProfile } from '@/src/services/residents.api';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';

export default function ResidentAboutScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const resident = useQuery({ queryKey: ['carehome', 'resident', id], queryFn: () => getCareHomeResidentById(id), enabled: !!id });
  const profile = useQuery({ queryKey: ['carehome', 'resident-care-profile', id], queryFn: () => getResidentCareProfile(id), enabled: !!id });
  const p = profile.data;
  const aboutRows = compactRows([
    ['What matters to me', p?.aboutMe?.whatMatters],
    ['Important people', p?.aboutMe?.importantPeople],
    ['How I communicate', p?.aboutMe?.communication || p?.communicationNeeds],
    ['How to support me', p?.aboutMe?.howToSupportMe],
    ['Please do and do not', p?.aboutMe?.pleaseDoAndDoNot],
    ['Also worth knowing', p?.aboutMe?.alsoWorthKnowing],
  ]);
  return <>
    <Stack.Screen options={{ title: 'About resident' }} />
    <ScreenContainer>
      {resident.data ? <ResidentWorkspaceHeader resident={resident.data} active="overview" /> : null}
      {profile.isLoading ? <SkeletonCard lines={5} /> : !p?.id ? <EmptyState icon={UserRound} title="About profile not completed" description="A manager can complete this resident’s preferences and support information from the manager dashboard." /> : <View style={{ gap: 12 }}>
        <ProfileCard icon={HeartHandshake} title="About me" rows={aboutRows} />
        <ProfileCard icon={ShieldAlert} title="Health, risks and allergies" rows={compactRows([
          ['Allergies', p.allergies.join(' · ') || 'None recorded'],
          ['Health conditions', p.healthConditions.join(' · ') || 'None recorded'],
          ['Mobility support', p.mobilitySupport],
          ['Nutrition and hydration', p.nutritionHydration],
          ['Continence support', p.continenceSupport],
          ['Medication support', p.medicationSupport],
          ['Emergency guidance', p.emergencyGuidance],
        ])} />
        <ProfileCard icon={Stethoscope} title="Healthcare and contacts" rows={compactRows([
          ['GP', [p.gpName, p.gpPractice].filter(Boolean).join(' · ')],
          ...p.contacts.map((contact): [string, string] => [contact.primary ? 'Primary contact' : contact.relationship || 'Contact', [contact.name, contact.phone, contact.email].filter(Boolean).join(' · ')]),
        ])} />
        <ProfileCard icon={MessageCircle} title="Consent and decision support" rows={compactRows([
          ['Capacity', p.capacitySummary], ['Consent', p.consentSummary], ['DoLS', p.dolsSummary],
        ])} />
      </View>}
    </ScreenContainer>
  </>;
}

function compactRows(rows: Array<[string, string | undefined]>): Array<[string, string]> {
  return rows.filter((row): row is [string, string] => Boolean(row[1]?.trim()));
}

function ProfileCard({ icon: Icon, title, rows }: { icon: typeof Phone; title: string; rows: string[][] }) {
  const colors = useThemeColors();
  if (!rows.length) return null;
  return <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}><Icon size={19} color={colors.primary}/><Text style={{ ...typography.bodyMedium, color: colors.text }}>{title}</Text></View>{rows.map(([label, value]) => <View key={label} style={{ marginTop: 11 }}><Text style={{ ...typography.label, color: colors.secondary }}>{label.toUpperCase()}</Text><Text style={{ ...typography.body, color: colors.text, marginTop: 3 }}>{value}</Text></View>)}</Card>;
}
