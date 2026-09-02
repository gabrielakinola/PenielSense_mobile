import { Share, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { getActiveHandover } from '@/src/services/handover.api';
import { getResidentEvidenceReport } from '@/src/services/intelligence.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';

export default function ResidentEvidenceReportScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const handover = useQuery({ queryKey: ['carehome', 'handovers', 'active'], queryFn: () => getActiveHandover() });
  const report = useQuery({
    queryKey: ['carehome', 'evidence-report', id, handover.data?.dateKey, handover.data?.shiftWindow],
    queryFn: () => getResidentEvidenceReport({ residentId: id, dateKey: handover.data!.dateKey, window: handover.data!.shiftWindow }),
    enabled: !!id && !!handover.data,
  });
  const data = report.data;
  const lines = data ? [
    `${data.resident.name} — ${data.period.windowLabel}`,
    data.intelligence.summary,
    '', 'Confirmed care notes:',
    ...data.careContext.notes.flatMap((note) => note.items.map((item) => `• ${item.category}: ${item.summary}`)),
    '', 'Care tasks:', ...data.careContext.tasks.map((task) => `• ${task.title}: ${task.status}${task.outcomeNote ? ` — ${task.outcomeNote}` : ''}`),
    '', 'Incidents:', ...data.careContext.incidents.map((incident) => `• ${incident.type} (${incident.severity}): ${incident.description}`),
    '', data.careContext.provenance,
  ] : [];

  return <>
    <Stack.Screen options={{ title: 'Evidence report' }} />
    <ScreenContainer>
      {handover.isLoading || report.isLoading ? <SkeletonCard lines={6} /> : !handover.data ? (
        <EmptyState icon={FileText} title="No shift report yet" description="Generate the current handover first, then this combined report will be available." />
      ) : report.isError ? (
        <EmptyState icon={FileText} title="Couldn’t load report" description={normalizeApiError(report.error)} actionLabel="Retry" onAction={() => void report.refetch()} />
      ) : data ? <View style={{ gap: 12 }}>
        <Card>
          <Text style={{ ...typography.heading, color: colors.text }}>{data.resident.name}</Text>
          <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }}>{data.period.windowLabel} · {data.period.dateKey}</Text>
          <Text style={{ ...typography.body, color: colors.text, marginTop: 14 }}>{data.intelligence.summary}</Text>
        </Card>
        <ReportSection title={`Confirmed care notes (${data.careContext.noteCount})`} lines={data.careContext.notes.flatMap((n) => n.items.map((i) => `${i.category}: ${i.summary}`))} />
        <ReportSection title="Care task outcomes" lines={data.careContext.tasks.map((t) => `${t.title} — ${t.status}${t.outcomeNote ? `: ${t.outcomeNote}` : ''}`)} />
        <ReportSection title="Incidents and safeguarding" lines={data.careContext.incidents.map((i) => `${i.type} · ${i.severity}${i.safeguardingConcern ? ' · safeguarding' : ''}: ${i.description}`)} />
        <ReportSection title="Sensor evidence" lines={Object.entries(data.supportingEvidence).flatMap(([source, evidence]) => evidence.map((line) => `${source}: ${line}`))} />
        <Text style={{ ...typography.caption, color: colors.secondary }}>{data.careContext.provenance}</Text>
        <AnimatedButton label="Share report" variant="secondary" accessibilityLabel="Share evidence report" onPress={() => void Share.share({ title: `${data.resident.name} evidence report`, message: lines.join('\n') })} />
      </View> : null}
    </ScreenContainer>
  </>;
}

function ReportSection({ title, lines }: { title: string; lines: string[] }) {
  const colors = useThemeColors();
  return <Card>
    <Text style={{ ...typography.bodyMedium, color: colors.text }}>{title}</Text>
    {lines.length ? lines.map((line, index) => <Text key={`${index}-${line}`} style={{ ...typography.caption, color: colors.secondary, marginTop: 8 }}>• {line}</Text>) : <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 8 }}>No entries in this period.</Text>}
  </Card>;
}
