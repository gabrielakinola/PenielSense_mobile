import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Activity, Bath, BedDouble, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, CircleAlert, CupSoda, Footprints, MessageSquareText, Pill, Soup, Toilet, Users } from "lucide-react-native";
import { Card } from "@/src/components/ui/Card";
import { IntelligenceStatusChip } from "@/src/components/residents/IntelligenceStatusChip";
import { listItemEnter } from "@/src/animations/presets";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import type { HandoverResidentCard } from "@/src/types/carehome.types";
import type { IntelligenceStatusTone } from "@/src/utils/resident-status";

function riskTone(risk: HandoverResidentCard["riskLevel"]): { label: string; tone: IntelligenceStatusTone; accentKey: "critical" | "watch" | "good" } {
  if (risk === "attention") return { label: "Needs a check", tone: "attention", accentKey: "critical" };
  if (risk === "watch") return { label: "Keep an eye on", tone: "watch", accentKey: "watch" };
  return { label: "Stable", tone: "stable", accentKey: "good" };
}

type CareGroup = { key: string; label: string; icon: typeof Activity; summaries: string[] };
const GROUP_RULES = [
  { key: "medication", label: "Medication", icon: Pill, words: /medicat|tablet|medicine/i },
  { key: "personal", label: "Personal care", icon: Bath, words: /shower|wash|oral care|dress|cream|personal care/i },
  { key: "mobility", label: "Mobility", icon: Footprints, words: /walk|zimmer|mobil|transfer|exercise/i },
  { key: "continence", label: "Continence", icon: Toilet, words: /toilet|bathroom|continence/i },
  { key: "fluid", label: "Hydration", icon: CupSoda, words: /fluid|water|drink|tea|juice|ml\b/i },
  { key: "food", label: "Meals", icon: Soup, words: /breakfast|lunch|dinner|meal|sandwich|soup|yoghurt|food|ate\b/i },
  { key: "activity", label: "Activity and company", icon: Users, words: /movie|film|netflix|activity|music|family|social|group/i },
  { key: "rest", label: "Sleep and rest", icon: BedDouble, words: /sleep|rest|bedtime|nap/i },
] as const;

function tidy(value: string) {
  return value.replace(/\s*[·•]\s*/g, ". ").replace(/\s*;\s*/g, ". ").replace(/\.{2,}/g, ".").replace(/\s+/g, " ").trim().replace(/^[-.,;:\s]+|[-.,;:\s]+$/g, "");
}
function headline(summary: string) { return tidy(summary.split(/care recorded this shift:/i)[0]); }
function groupCare(entries: NonNullable<HandoverResidentCard["careCompleted"]>): CareGroup[] {
  const groups = new Map<string, CareGroup>();
  const seen = new Set<string>();
  entries.forEach((entry) => {
    const summary = tidy(entry.summary);
    const signature = summary.toLowerCase();
    if (!summary || seen.has(signature)) return;
    seen.add(signature);
    const match = GROUP_RULES.find((rule) => rule.words.test(summary));
    const rule = match ?? { key: "other", label: "Other care", icon: CheckCircle2 };
    const current = groups.get(rule.key) ?? { key: rule.key, label: rule.label, icon: rule.icon, summaries: [] };
    current.summaries.push(summary);
    groups.set(rule.key, current);
  });
  return [...groups.values()];
}

interface Props {
  resident: HandoverResidentCard; index: number; position: number; total: number; onPress: () => void; onPrevious?: () => void; onNext?: () => void;
}

export function HandoverResidentRow({ resident, index, position, total, onPress, onPrevious, onNext }: Props) {
  const colors = useThemeColors();
  const [showEvidence, setShowEvidence] = useState(false);
  const status = riskTone(resident.riskLevel);
  const accent = colors.status[status.accentKey];
  const careGroups = useMemo(() => groupCare(resident.careCompleted ?? []), [resident.careCompleted]);
  const needsAttention = resident.reviewFlags.length > 0 || resident.attentionRequired;
  return (
    <Animated.View entering={listItemEnter(index)} style={{ marginBottom: 12 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ height: 4, backgroundColor: accent }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }}><Text style={{ ...typography.title, color: colors.text }}>{resident.residentName}</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 2 }}>{resident.room}{resident.connectedDevices.length ? ` · ${resident.connectedDevices.join(", ")}` : ""}</Text></View>
            <IntelligenceStatusChip label={status.label} tone={status.tone} />
          </View>
          <Text style={{ ...typography.label, color: colors.secondary, marginTop: 18, fontWeight: "700" }}>WHAT STAFF NEED TO KNOW</Text>
          <Text style={{ ...typography.body, color: colors.text, marginTop: 6, lineHeight: 22 }}>{headline(resident.summary) || (status.tone === "stable" ? "No new concerns were recorded for this shift." : "Please review the items below during this shift.")}</Text>
          {needsAttention ? <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: colors.statusBg.watch, flexDirection: "row", gap: 9 }}><CircleAlert size={19} color={colors.status.watch} /><View style={{ flex: 1 }}><Text style={{ ...typography.label, color: colors.status.watch, fontWeight: "700" }}>KEEP AN EYE ON</Text><Text style={{ ...typography.caption, color: colors.text, marginTop: 4 }}>{resident.reviewFlags.length ? `${resident.reviewFlags.length} open review ${resident.reviewFlags.length === 1 ? "flag needs" : "flags need"} attention.` : "An in-person check has been suggested."}</Text></View></View> : null}
          {careGroups.length ? <View style={{ marginTop: 18 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}><CheckCircle2 size={18} color={colors.status.good} /><Text style={{ ...typography.label, color: colors.status.good, fontWeight: "700" }}>CARE COMPLETED</Text></View><View style={{ marginTop: 6 }}>{careGroups.map((group) => { const Icon = group.icon; return <View key={group.key} style={{ flexDirection: "row", gap: 11, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border }}><View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.statusBg.good }}><Icon size={17} color={colors.status.good} /></View><View style={{ flex: 1 }}><Text style={{ ...typography.bodyMedium, color: colors.text }}>{group.label}</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 2, lineHeight: 18 }}>{group.summaries.join(" ")}</Text></View></View>; })}</View></View> : null}
          {(resident.handoverNotes ?? []).map((note) => <View key={note.id} style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.statusBg.watch, flexDirection: "row", gap: 9 }}><MessageSquareText size={18} color={colors.status.watch} /><View style={{ flex: 1 }}><Text style={{ ...typography.label, color: colors.status.watch, fontWeight: "700" }}>STAFF HANDOVER NOTE</Text><Text style={{ ...typography.caption, color: colors.text, marginTop: 4 }}>{tidy(note.summary)}</Text><Text style={{ ...typography.label, color: colors.secondary, marginTop: 4 }}>{note.recordedBy}</Text></View></View>)}
          <Pressable onPress={() => setShowEvidence((value) => !value)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 }}><Text style={{ ...typography.label, color: colors.primary, fontWeight: "700" }}>Supporting sensor information</Text>{showEvidence ? <ChevronUp size={18} color={colors.primary} /> : <ChevronDown size={18} color={colors.primary} />}</Pressable>
          {showEvidence ? <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceElevated }}><Text style={{ ...typography.caption, color: colors.text }}>Routine: {resident.routineStatus || "Not recorded"}</Text><Text style={{ ...typography.caption, color: colors.text, marginTop: 5 }}>Location: {resident.currentLocation || "Not confirmed"}</Text><Text style={{ ...typography.caption, color: colors.text, marginTop: 5 }}>Connected: {resident.connectedDevices.join(", ") || "No devices listed"}</Text></View> : null}
          <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}><Text style={{ ...typography.label, color: colors.primary, fontWeight: "700" }}>View full resident timeline</Text><ChevronRight size={18} color={colors.primary} /></Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }}><Pressable disabled={!onPrevious} onPress={onPrevious} hitSlop={8}><Text style={{ ...typography.label, color: onPrevious ? colors.primary : colors.border }}>Previous</Text></Pressable><Text style={{ ...typography.caption, color: colors.secondary }}>{position} of {total}</Text><Pressable disabled={!onNext} onPress={onNext} hitSlop={8}><Text style={{ ...typography.label, color: onNext ? colors.primary : colors.border }}>Next</Text></Pressable></View>
        </View>
      </Card>
    </Animated.View>
  );
}
