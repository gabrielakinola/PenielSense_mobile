import { useMemo, useState } from "react";
import { Alert, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Check, ChevronRight, ClipboardCheck, Users } from "lucide-react-native";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PageIntro } from "@/src/components/ui/PageIntro";
import { getCareTasks, recordCareTaskOutcome } from "@/src/services/care-tasks.api";
import { createCareEntry } from "@/src/services/care-entries.api";
import { getOperationalRecords } from "@/src/services/operational-records.api";
import { getCareHomeResidents } from "@/src/services/residents.api";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import type { CareTaskDto, CareTaskStatus } from "@/src/types/care-task.types";
import type { OperationalRecordDto } from "@/src/types/operational-record.types";
import type { ApiResidentDto } from "@/src/types/carehome.types";
import type { CareEntryCategory } from "@/src/types/care-entry.types";

function upcomingWindow() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const key = (item: Date) => `${item.getFullYear()}-${item.getMonth()}-${item.getDate()}`;
  if (key(date) === key(today)) return "Today";
  if (key(date) === key(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

type WorkItem =
  | { kind: "task"; id: string; at: string; residentId: string; task: CareTaskDto }
  | { kind: "appointment"; id: string; at: string; residentId: string; appointment: OperationalRecordDto };

export default function TasksScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CareTaskDto | null>(null);
  const window = useMemo(upcomingWindow, []);
  const tasksQuery = useQuery({
    queryKey: ["carehome", "care-tasks", "upcoming"],
    queryFn: () => getCareTasks(window),
  });
  const appointmentsQuery = useQuery({
    queryKey: ["carehome", "operational-records", "appointments", window],
    queryFn: async () => {
      const records = await getOperationalRecords(window);
      return records.filter((record) =>
        ["APPOINTMENT", "PROFESSIONAL_VISIT"].includes(record.kind),
      );
    },
  });
  const residentsQuery = useQuery({
    queryKey: ["carehome", "residents", "task-names"],
    queryFn: () => getCareHomeResidents(),
  });
  const residentById = useMemo(
    () => new Map((residentsQuery.data ?? []).map((resident) => [resident.id, resident])),
    [residentsQuery.data],
  );
  const items = useMemo<WorkItem[]>(() => {
    const tasks = (tasksQuery.data ?? []).map((task) => ({
      kind: "task" as const,
      id: `task-${task.id}`,
      at: task.dueAt,
      residentId: task.residentId,
      task,
    }));
    const appointments = (appointmentsQuery.data ?? []).map((appointment) => ({
      kind: "appointment" as const,
      id: `appointment-${appointment.id}`,
      at: appointment.occurredAt,
      residentId: appointment.residentId,
      appointment,
    }));
    return [...tasks, ...appointments].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [appointmentsQuery.data, tasksQuery.data]);
  const outstanding = (tasksQuery.data ?? []).filter((task) => task.status === "PENDING").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Tasks & appointments" />
      <ScreenContainer scroll={false} padded={false}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await Promise.all([tasksQuery.refetch(), appointmentsQuery.refetch(), residentsQuery.refetch()]);
                setRefreshing(false);
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <PageIntro
              eyebrow="Shared care schedule"
              title={`${outstanding} task${outstanding === 1 ? "" : "s"} outstanding`}
              subtitle="Unassigned tasks and resident appointments are visible to the whole care team for the next seven days."
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing scheduled"
              description={
                tasksQuery.isError || appointmentsQuery.isError
                  ? normalizeApiError(tasksQuery.error ?? appointmentsQuery.error)
                  : "Tasks and appointments for the next seven days will appear here."
              }
            />
          }
          renderItem={({ item }) => {
            const task = item.kind === "task" ? item.task : null;
            const appointment = item.kind === "appointment" ? item.appointment : null;
            const overdue = !!task && task.status === "PENDING" && new Date(task.dueAt).getTime() < Date.now();
            const accent = appointment
              ? "#6D5CE7"
              : task?.priority === "URGENT" || overdue
                ? colors.status.critical
                : task?.priority === "IMPORTANT"
                  ? colors.status.watch
                  : colors.primary;
            return (
              <Card style={{ marginBottom: 12, padding: 0, overflow: "hidden", borderLeftWidth: 4, borderLeftColor: accent }}>
                <View style={{ flexDirection: "row", gap: 12, padding: 14 }}>
                  <ResidentAvatar resident={residentById.get(item.residentId)} onPress={() => router.push(`/residents/${item.residentId}`)} />
                  <Pressable onPress={() => task ? setSelectedTask(task) : router.push(`/residents/${item.residentId}`)} style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <Text style={{ ...typography.label, color: accent }}>{task ? task.category.replaceAll("_", " ") : "APPOINTMENT"}</Text>
                      {overdue ? <Text style={{ ...typography.label, color: colors.status.critical }}>OVERDUE</Text> : null}
                    </View>
                    <Text style={{ ...typography.bodyMedium, color: colors.text, marginTop: 4 }}>
                      {appointment?.title ?? task?.title}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>
                      {residentById.get(item.residentId)?.preferredName || residentById.get(item.residentId)?.fullName || "Resident"} · {dayLabel(item.at)} at {new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.text, marginTop: 5 }} numberOfLines={2}>
                      {appointment
                        ? [appointment.professional, appointment.organisation, appointment.summary].filter(Boolean).join(" · ") || "Resident appointment"
                        : task?.instructions}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
                      <Users size={13} color={colors.secondary} />
                      <Text style={{ ...typography.label, color: colors.secondary }}>{task?.assignedToName ? `Owner: ${task.assignedToName} · visible to team` : "Visible to all carers"}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.secondary} />
                  </Pressable>
                </View>
              </Card>
            );
          }}
        />
      </ScreenContainer>
      {selectedTask ? (
        <TaskDetailModal
          task={selectedTask}
          resident={residentById.get(selectedTask.residentId)}
          close={() => setSelectedTask(null)}
          openResident={() => { const id = selectedTask.residentId; setSelectedTask(null); router.push(`/residents/${id}`); }}
          saved={async () => {
            setSelectedTask(null);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["carehome", "care-tasks"] }),
              queryClient.invalidateQueries({ queryKey: ["carehome", "care-entries", selectedTask.residentId] }),
            ]);
          }}
        />
      ) : null}
    </View>
  );
}

function ResidentAvatar({ resident, onPress }: { resident?: ApiResidentDto; onPress: () => void }) {
  const colors = useThemeColors();
  const name = resident?.preferredName || resident?.fullName || "Resident";
  return (
    <Pressable onPress={onPress} accessibilityLabel={`Open ${name}'s profile`} style={{ width: 58, alignItems: "center" }}>
      <View style={{ width: 54, height: 54, borderRadius: 27, overflow: "hidden", backgroundColor: `${colors.primary}18`, alignItems: "center", justifyContent: "center" }}>
        {resident?.photoUrl ? <Image source={{ uri: resident.photoUrl }} style={{ width: "100%", height: "100%" }} /> : <Text style={{ ...typography.heading, color: colors.primary }}>{name.slice(0, 1)}</Text>}
      </View>
      <Text numberOfLines={1} style={{ fontSize: 10, color: colors.primary, marginTop: 4 }}>Profile</Text>
    </Pressable>
  );
}

function timelineCategory(taskCategory: string): CareEntryCategory {
  const map: Record<string, CareEntryCategory> = {
    PERSONAL_CARE: "PERSONAL_CARE", SHOWER_BATHING: "SHOWER_BATHING", ORAL_CARE: "ORAL_CARE", DRESSING: "DRESSING",
    CONTINENCE: "CONTINENCE", MOBILITY: "MOBILITY", EXERCISE: "EXERCISE", ENTERTAINMENT: "ENTERTAINMENT",
    NUTRITION_HYDRATION: "FOOD", SLEEP: "SLEEP_REST", MEDICATION_SUPPORT: "MEDICATION_OBSERVATION",
    EMOTIONAL_WELLBEING: "MOOD_BEHAVIOUR", SOCIAL_ACTIVITY: "ENTERTAINMENT",
  };
  return map[taskCategory] ?? "GENERAL_WELLBEING";
}

function TaskDetailModal({ task, resident, close, openResident, saved }: { task: CareTaskDto; resident?: ApiResidentDto; close: () => void; openResident: () => void; saved: () => Promise<void> }) {
  const colors = useThemeColors();
  const [status, setStatus] = useState<Exclude<CareTaskStatus, "PENDING">>("COMPLETED");
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const wording = note.trim();
      const outcome = await recordCareTaskOutcome(task.id, status, wording);
      if (wording) {
        await createCareEntry(task.residentId, {
          rawText: `${task.title}: ${wording}`,
          items: [{ category: timelineCategory(task.category), summary: wording.slice(0, 500) }],
          extractedItems: [], observations: [], extractedObservations: [], usedOpenAI: false, model: null,
          handoverRequired: status !== "COMPLETED",
          requiresExtractionOnSync: true,
        });
      }
      return outcome;
    },
    onSuccess: saved,
    onError: (error) => Alert.alert("Could not record task", normalizeApiError(error)),
  });
  const name = resident?.preferredName || resident?.fullName || "Resident";
  return (
    <Modal transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,.42)" }}>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: "88%", backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <ResidentAvatar resident={resident} onPress={openResident} />
            <View style={{ flex: 1 }}><Text style={{ ...typography.heading, color: colors.text }}>{task.title}</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>{name} · Room {resident?.roomNo || "—"}</Text></View>
            <Pressable onPress={close}><Text style={{ ...typography.label, color: colors.primary }}>Close</Text></Pressable>
          </View>
          <View style={{ marginTop: 18, padding: 14, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }}>
            <Text style={{ ...typography.label, color: colors.primary }}>{task.category.replaceAll("_", " ")}</Text>
            <Text style={{ ...typography.body, color: colors.text, marginTop: 7 }}>{task.instructions}</Text>
            <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 8 }}>Due {new Date(task.dueAt).toLocaleString()} · {task.recurrence === "DAILY" ? "Repeats daily" : "One-off"}</Text>
          </View>
          {task.status === "PENDING" ? <>
            <Text style={{ ...typography.label, color: colors.secondary, marginTop: 18 }}>OUTCOME</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{([['COMPLETED','Completed'],['PARTIAL','Partly completed'],['DECLINED','Declined'],['ESCALATED','Unable / escalate']] as const).map(([value,label]) => <Pressable key={value} onPress={() => setStatus(value)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: status === value ? colors.primary : colors.border, backgroundColor: status === value ? `${colors.primary}14` : 'transparent' }}><Text style={{ ...typography.label, color: status === value ? colors.primary : colors.text }}>{label}</Text></Pressable>)}</View>
            <Text style={{ ...typography.label, color: colors.secondary, marginTop: 18 }}>CARE NOTE (OPTIONAL)</Text>
            <TextInput value={note} onChangeText={setNote} multiline placeholder="What was done, observed or declined?" placeholderTextColor={colors.secondary} style={{ minHeight: 110, marginTop: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text, textAlignVertical: "top" }} />
            <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 6 }}>Your wording is saved with the task and, when supplied, categorized into the resident timeline in the background.</Text>
            <Pressable disabled={mutation.isPending} onPress={() => mutation.mutate()} style={{ minHeight: 50, marginTop: 16, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, opacity: mutation.isPending ? .5 : 1 }}><Check size={18} color="#FFF"/><Text style={{ ...typography.bodyMedium, color: "#FFF" }}>{mutation.isPending ? "Saving…" : "Save task outcome"}</Text></Pressable>
          </> : <View style={{ marginTop: 18 }}><Text style={{ ...typography.heading, color: colors.status.good }}>{task.status.replaceAll("_", " ")}</Text>{task.outcomeNote ? <Text style={{ ...typography.body, color: colors.text, marginTop: 8 }}>{task.outcomeNote}</Text> : null}<Text style={{ ...typography.caption, color: colors.secondary, marginTop: 6 }}>{task.completedAt ? new Date(task.completedAt).toLocaleString() : "Recorded"}</Text></View>}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}
