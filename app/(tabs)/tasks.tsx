import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CalendarDays, Check, ChevronRight, ClipboardCheck, Clock3, Users } from "lucide-react-native";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PageIntro } from "@/src/components/ui/PageIntro";
import { getCareTasks, recordCareTaskOutcome } from "@/src/services/care-tasks.api";
import { getOperationalRecords } from "@/src/services/operational-records.api";
import { getCareHomeResidents } from "@/src/services/residents.api";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import type { CareTaskDto, CareTaskStatus } from "@/src/types/care-task.types";
import type { OperationalRecordDto } from "@/src/types/operational-record.types";

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
  const window = useMemo(upcomingWindow, []);
  const tasksQuery = useQuery({
    queryKey: ["carehome", "care-tasks", "upcoming"],
    queryFn: () => getCareTasks(window),
  });
  const appointmentsQuery = useQuery({
    queryKey: ["carehome", "operational-records", "appointments", window],
    queryFn: () => getOperationalRecords({ ...window, kind: "APPOINTMENT" }),
  });
  const residentsQuery = useQuery({
    queryKey: ["carehome", "residents", "task-names"],
    queryFn: () => getCareHomeResidents(),
  });
  const names = useMemo(
    () => new Map((residentsQuery.data ?? []).map((resident) => [resident.id, resident.preferredName || resident.fullName])),
    [residentsQuery.data],
  );
  const mutation = useMutation({
    mutationFn: ({ task, status }: { task: CareTaskDto; status: Exclude<CareTaskStatus, "PENDING"> }) =>
      recordCareTaskOutcome(task.id, status),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["carehome", "care-tasks"] }),
    onError: (error) => Alert.alert("Could not record care", normalizeApiError(error)),
  });
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

  const chooseOutcome = (task: CareTaskDto) =>
    Alert.alert("Record care outcome", task.title, [
      { text: "Completed", onPress: () => mutation.mutate({ task, status: "COMPLETED" }) },
      { text: "Partly completed", onPress: () => mutation.mutate({ task, status: "PARTIAL" }) },
      { text: "Declined", onPress: () => mutation.mutate({ task, status: "DECLINED" }) },
      { text: "Unable / escalate", onPress: () => mutation.mutate({ task, status: "ESCALATED" }) },
      { text: "Cancel", style: "cancel" },
    ]);

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
              <Card style={{ marginBottom: 12, borderLeftWidth: 3, borderLeftColor: accent }}>
                <Pressable onPress={() => router.push(`/residents/${item.residentId}`)} style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: appointment ? "#EFEDFF" : colors.surfaceElevated }}>
                    {appointment ? <CalendarDays size={19} color={accent} /> : <ClipboardCheck size={19} color={accent} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.label, color: colors.secondary }}>
                      {dayLabel(item.at)} · {new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Text style={{ ...typography.bodyMedium, color: colors.text, marginTop: 4 }}>
                      {appointment?.title ?? task?.title}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>
                      {names.get(item.residentId) ?? "Resident"}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.text, marginTop: 5 }} numberOfLines={2}>
                      {appointment
                        ? [appointment.professional, appointment.organisation, appointment.summary].filter(Boolean).join(" · ") || "Resident appointment"
                        : task?.instructions}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
                      <Users size={13} color={colors.secondary} />
                      <Text style={{ ...typography.label, color: colors.secondary }}>Visible to all carers</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.secondary} />
                </Pressable>
                {task?.status === "PENDING" ? (
                  <Pressable
                    onPress={() => chooseOutcome(task)}
                    disabled={mutation.isPending}
                    style={{ marginTop: 14, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}
                  >
                    <Check size={18} color="#FFFFFF" />
                    <Text style={{ ...typography.bodyMedium, color: "#FFFFFF" }}>Record outcome</Text>
                  </Pressable>
                ) : task ? (
                  <View style={{ marginTop: 12, flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Clock3 size={15} color={colors.status.good} />
                    <Text style={{ ...typography.caption, color: colors.status.good }}>{task.status.replace("_", " ")}</Text>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      </ScreenContainer>
    </View>
  );
}
