import { useCallback, useState, type ReactNode } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CheckCircle2, ClipboardList } from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { PageIntro } from "@/src/components/ui/PageIntro";
import { Card } from "@/src/components/ui/Card";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { AnimatedButton } from "@/src/components/ui/AnimatedButton";
import { HandoverResidentRow } from "@/src/components/handovers/HandoverResidentRow";
import {
  generateHandover,
  getActiveHandover,
  acknowledgeHandover,
} from "@/src/services/handover.api";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useResolvedTheme } from "@/src/theme/theme-provider";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import { MyHandoverPanel } from "@/src/components/handovers/MyHandoverPanel";

const SHIFT_COPY = {
  morning: "Morning handover",
  afternoon: "Afternoon handover",
  night: "Night handover",
} as const;

export default function HandoversScreen() {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"home" | "mine">("home");
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);

  const handoverQuery = useQuery({
    queryKey: ["carehome", "handovers", "active"],
    queryFn: () => getActiveHandover({ sort: "priority" }),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateHandover(false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["carehome", "handovers"],
      });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (handoverId: string) => acknowledgeHandover(handoverId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["carehome", "handovers", "active"], updated);
    },
    onError: (error) => {
      Alert.alert("Could not save acknowledgement", normalizeApiError(error));
    },
  });

  const handover = handoverQuery.data;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handoverQuery.refetch();
    setRefreshing(false);
  }, [handoverQuery]);

  const shell = (body: ReactNode) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Handovers" />
      {body}
    </View>
  );

  const modeSelector = (
    <View
      style={{
        flexDirection: "row",
        padding: 4,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
      }}
    >
      {(
        [
          ["home", "Care-home handover"],
          ["mine", "My handover"],
        ] as const
      ).map(([value, label]) => {
        const selected = mode === value;
        return (
          <Pressable
            key={value}
            onPress={() => setMode(value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: radius.full,
              backgroundColor: selected ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                ...typography.label,
                textAlign: "center",
                fontWeight: "700",
                color: selected ? "#FFFFFF" : colors.secondary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (mode === "mine") {
    return shell(
      <ScreenContainer>
        {modeSelector}
        <MyHandoverPanel />
      </ScreenContainer>,
    );
  }

  if (handoverQuery.isLoading) {
    return shell(
      <ScreenContainer>
        {modeSelector}
        <SkeletonCard lines={4} />
      </ScreenContainer>,
    );
  }

  if (handoverQuery.isError) {
    return shell(
      <ScreenContainer>
        {modeSelector}
        <EmptyState
          icon={ClipboardList}
          title="Couldn’t load handover"
          description={normalizeApiError(handoverQuery.error)}
          actionLabel="Retry"
          onAction={() => void handoverQuery.refetch()}
        />
      </ScreenContainer>,
    );
  }

  if (!handover) {
    return shell(
      <ScreenContainer>
        {modeSelector}
        <PageIntro
          eyebrow="Shift change"
          title="No active handover yet"
          subtitle="Generate the shared shift report for the whole care home."
        />
        <EmptyState
          icon={ClipboardList}
          title="Ready when you are"
          description="This is the shared care-home report. Your own daily handover is under My handover."
          actionLabel={
            generateMutation.isPending
              ? "Generating…"
              : "Generate care-home handover"
          }
          onAction={() => generateMutation.mutate()}
        />
      </ScreenContainer>,
    );
  }

  const residents = [...handover.residents].sort((a, b) => {
    const rank = { attention: 0, watch: 1, normal: 2 } as const;
    return rank[a.riskLevel] - rank[b.riskLevel];
  });
  const highlightedResidents = residents.filter(
    (resident) =>
      resident.attentionRequired || resident.handoverNotes.length > 0,
  );
  const displayedResidents = highlightedResidents.length
    ? highlightedResidents
    : residents;
  const foundIndex = displayedResidents.findIndex(
    (resident) => resident.residentId === selectedResidentId,
  );
  const selectedIndex = foundIndex < 0 ? 0 : foundIndex;
  const selectedResident = displayedResidents[selectedIndex];

  return shell(
    <ScreenContainer scroll={false} padded={false}>
      <FlatList
        data={selectedResident ? [selectedResident] : []}
        keyExtractor={(item) => item.residentId}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            {modeSelector}
            <PageIntro
              eyebrow={handover.dateKey}
              title={SHIFT_COPY[handover.shiftWindow]}
              subtitle={`${handover.careHomeSummary.residentsMonitored} residents · ${handover.careHomeSummary.residentsRequiringAttention} need attention · ${Math.max(
                0,
                handover.careHomeSummary.residentsMonitored -
                  handover.careHomeSummary.residentsRequiringAttention,
              )} settled`}
              footer={
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {[
                    {
                      label: "Attention",
                      value:
                        handover.careHomeSummary.residentsRequiringAttention,
                      color: colors.status.critical,
                      bg: colors.statusBg.critical,
                    },
                    {
                      label: "Flags",
                      value: handover.careHomeSummary.residentsWithReviewFlags,
                      color: colors.status.watch,
                      bg: colors.statusBg.watch,
                    },
                    {
                      label: "Monitored",
                      value: handover.careHomeSummary.residentsMonitored,
                      color: colors.primary,
                      bg:
                        theme === "dark"
                          ? "rgba(135,165,248,0.14)"
                          : "rgba(37,99,235,0.08)",
                    },
                  ].map((pill) => (
                    <View
                      key={pill.label}
                      style={{
                        borderRadius: radius.full,
                        backgroundColor: pill.bg,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.label,
                          color: pill.color,
                          fontWeight: "700",
                        }}
                      >
                        {pill.value} {pill.label}
                      </Text>
                    </View>
                  ))}
                </View>
              }
            />

            <Card style={{ marginBottom: 12 }}>
              <Text
                style={{
                  ...typography.label,
                  color: colors.primary,
                  fontWeight: "700",
                }}
              >
                HOME OVERVIEW
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: colors.text,
                  marginTop: 6,
                  marginBottom: 10,
                  lineHeight: 22,
                }}
              >
                {handover.careHomeSummary.narrative}
              </Text>
              <Text style={{ ...typography.caption, color: colors.secondary }}>
                Sleep changes{" "}
                {handover.careHomeSummary.residentsWithSleepChanges} · Movement{" "}
                {handover.careHomeSummary.residentsWithIncreasedMovement} ·
                Device issues {handover.careHomeSummary.deviceIssues}
              </Text>
              {handover.generatedBy ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                    marginTop: 6,
                  }}
                >
                  Generated by {handover.generatedBy.name}
                </Text>
              ) : null}
              {handover.canRefresh ? (
                <View style={{ marginTop: 12 }}>
                  <AnimatedButton
                    label={
                      generateMutation.isPending
                        ? "Refreshing…"
                        : "Refresh this shift once"
                    }
                    onPress={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    size="md"
                  />
                </View>
              ) : (
                <Text
                  style={{
                    ...typography.label,
                    color: colors.secondary,
                    marginTop: 10,
                  }}
                >
                  Manual refresh already used for this shift.
                </Text>
              )}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  marginTop: 14,
                  paddingTop: 14,
                }}
              >
                {handover.currentUserHasRead ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={20} color={colors.status.good} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ ...typography.bodyMedium, color: colors.text }}
                      >
                        You have read this handover
                      </Text>
                      <Text
                        style={{
                          ...typography.caption,
                          color: colors.secondary,
                          marginTop: 2,
                        }}
                      >
                        {handover.readBy.length} staff acknowledgement
                        {handover.readBy.length === 1 ? "" : "s"} recorded
                      </Text>
                    </View>
                  </View>
                ) : (
                  <AnimatedButton
                    label={
                      acknowledgeMutation.isPending
                        ? "Saving…"
                        : "I have read this handover"
                    }
                    onPress={() => acknowledgeMutation.mutate(handover.id)}
                    disabled={acknowledgeMutation.isPending}
                    size="md"
                    accessibilityLabel="Confirm that you have read this handover"
                  />
                )}
              </View>
            </Card>

            <SectionHeader
              title={
                highlightedResidents.length
                  ? "Highlighted for handover"
                  : "Resident handovers"
              }
            />
            <FlatList
              horizontal
              data={displayedResidents}
              keyExtractor={(resident) => resident.residentId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
              renderItem={({ item }) => {
                const selected = item.residentId === selectedResident?.residentId;
                const tone =
                  item.riskLevel === "attention"
                    ? colors.status.critical
                    : item.riskLevel === "watch"
                      ? colors.status.watch
                      : colors.status.good;
                return (
                  <Pressable
                    onPress={() => setSelectedResidentId(item.residentId)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : colors.surface,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: selected ? "#FFFFFF" : tone,
                      }}
                    />
                    <Text
                      style={{
                        ...typography.label,
                        fontWeight: "700",
                        color: selected ? "#FFFFFF" : colors.text,
                      }}
                    >
                      {item.residentName}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={ClipboardList}
            title="No resident cards"
            description="This handover has no resident summaries yet."
          />
        }
        renderItem={({ item, index }) => (
          <HandoverResidentRow
            resident={item}
            index={index}
            position={selectedIndex + 1}
            total={displayedResidents.length}
            onPrevious={
              selectedIndex > 0
                ? () =>
                    setSelectedResidentId(
                      displayedResidents[selectedIndex - 1].residentId,
                    )
                : undefined
            }
            onNext={
              selectedIndex < displayedResidents.length - 1
                ? () =>
                    setSelectedResidentId(
                      displayedResidents[selectedIndex + 1].residentId,
                    )
                : undefined
            }
            onPress={() => router.push(`/residents/${item.residentId}`)}
          />
        )}
      />
    </ScreenContainer>,
  );
}
