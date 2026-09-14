import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, ShieldAlert } from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { getResidentAssessments } from "@/src/services/residents.api";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { normalizeApiError } from "@/src/lib/api-client";

export default function ResidentAssessmentsScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>(); const colors = useThemeColors(); const [open, setOpen] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["carehome", "assessments", id], queryFn: () => getResidentAssessments(id), enabled: !!id });
  const records = query.data?.filter((item) => item.status !== "ARCHIVED") ?? [];
  return <><Stack.Screen options={{ title: "Assessments" }} /><ScreenContainer>
    <Text style={{ ...typography.title, color: colors.text }}>Assessments</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4, marginBottom: 16 }}>Current needs, risks and review evidence. Assessments are managed through the manager portal.</Text>
    {query.isLoading ? <SkeletonCard lines={5} /> : query.isError ? <EmptyState icon={ShieldAlert} title="Couldn’t load assessments" description={normalizeApiError(query.error)} actionLabel="Retry" onAction={() => void query.refetch()} /> : !records.length ? <EmptyState icon={ClipboardCheck} title="No assessments recorded" description="A manager has not completed an assessment for this resident yet." /> : records.map((item) => { const expanded = open === item.id; const due = item.reviewDueAt ? new Date(item.reviewDueAt).toLocaleDateString("en-GB") : "Not set"; return <Card key={item.id} style={{ marginBottom: 12 }}><Pressable onPress={() => setOpen(expanded ? null : item.id)} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><CheckCircle2 size={20} color={item.status === "COMPLETED" ? colors.status.good : colors.status.watch} /><View style={{ flex: 1 }}><Text style={{ ...typography.bodyMedium, color: colors.text }}>{item.title}</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>{item.status} · Risk {item.overallRisk.replace("_", " ")} · Review {due}</Text></View>{expanded ? <ChevronUp size={18} color={colors.secondary} /> : <ChevronDown size={18} color={colors.secondary} />}</Pressable>{expanded ? <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}><Text style={{ ...typography.label, color: colors.secondary }}>SUMMARY</Text><Text style={{ ...typography.body, color: colors.text, marginTop: 5 }}>{item.summary || "No summary recorded."}</Text>{item.actionsRequired ? <><Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>ACTIONS REQUIRED</Text><Text style={{ ...typography.body, color: colors.text, marginTop: 5 }}>{item.actionsRequired}</Text></> : null}<Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>RECORDED EVIDENCE</Text>{item.answers.filter((answer) => answer.response || answer.notApplicable).map((answer) => <View key={answer.questionId} style={{ marginTop: 9 }}><Text style={{ ...typography.bodyMedium, color: colors.text }}>{answer.label}</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 2 }}>{answer.notApplicable ? "Not applicable" : answer.response}</Text></View>)}</View> : null}</Card>; })}
  </ScreenContainer></>;
}
