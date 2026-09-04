import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import {
  generateCarePlanDraft,
  getCarePlan,
  getCarePlanRecommendations,
  saveCarePlan,
} from "@/src/services/care-plan.api";
import { getCareHomeResidentById } from "@/src/services/residents.api";
import { ResidentWorkspaceHeader } from "@/src/components/residents/ResidentWorkspaceHeader";
import { normalizeApiError } from "@/src/lib/api-client";
import { useAuthStore } from "@/src/stores/auth-store";
import { isCareHomeManagerRole } from "@/src/lib/care-home-home";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import type {
  CarePlanSectionDto,
  CarePlanStatus,
} from "@/src/types/care-plan.types";

const CATEGORIES = [
  "PERSONAL_CARE",
  "CONTINENCE",
  "MOBILITY",
  "NUTRITION_HYDRATION",
  "COMMUNICATION",
  "SKIN_INTEGRITY",
  "SLEEP",
  "COGNITION",
  "EMOTIONAL_WELLBEING",
  "SOCIAL_ACTIVITY",
  "MEDICATION_SUPPORT",
  "OTHER",
];
const emptySection = (): CarePlanSectionDto => ({
  category: "PERSONAL_CARE",
  assessedNeed: "",
  desiredOutcome: "",
  supportInstructions: "",
  risks: "",
  preferences: "",
});

export default function CarePlanScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isManager = isCareHomeManagerRole(
    useAuthStore((state) => state.user?.role),
  );
  const query = useQuery({
    queryKey: ["carehome", "care-plan", id],
    queryFn: () => getCarePlan(id),
    enabled: !!id,
  });
  const resident = useQuery({
    queryKey: ["carehome", "resident", id],
    queryFn: () => getCareHomeResidentById(id),
    enabled: !!id,
  });
  const recommendations = useQuery({
    queryKey: ["carehome", "care-plan-recommendations", id],
    queryFn: () => getCarePlanRecommendations(id),
    enabled: !!id && isManager,
  });
  const [sections, setSections] = useState<CarePlanSectionDto[]>([]);
  const [changeReason, setChangeReason] = useState("");
  useEffect(() => {
    if (query.data)
      setSections(query.data.sections.map((section) => ({ ...section })));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (status: CarePlanStatus) =>
      saveCarePlan(id, {
        changeReason: changeReason.trim(),
        sections,
        status,
        effectiveFrom:
          status === "ACTIVE"
            ? new Date().toISOString()
            : (query.data?.effectiveFrom ?? undefined),
        reviewDueAt: query.data?.reviewDueAt ?? undefined,
      }),
    onSuccess: async () => {
      setChangeReason("");
      await queryClient.invalidateQueries({
        queryKey: ["carehome", "care-plan", id],
      });
      Alert.alert(
        "Care plan saved",
        "The new version is now available to authorised staff.",
      );
    },
    onError: (error) =>
      Alert.alert("Could not save care plan", normalizeApiError(error)),
  });
  const draftMutation = useMutation({
    mutationFn: () =>
      generateCarePlanDraft(
        id,
        recommendations.data!.recommendations.map((item) => item.category),
      ),
    onSuccess: (draft) => {
      setSections(draft.sections);
      setChangeReason("Draft created from reviewed Peniel Care evidence");
      Alert.alert("Editable draft created", draft.notice);
    },
    onError: (error) =>
      Alert.alert("Could not generate draft", normalizeApiError(error)),
  });
  const inputStyle = {
    ...typography.body,
    color: colors.text,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 6,
  };
  const update = (index: number, patch: Partial<CarePlanSectionDto>) =>
    setSections((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  const valid =
    sections.length > 0 &&
    changeReason.trim().length >= 3 &&
    sections.every(
      (item) =>
        item.assessedNeed.trim() &&
        item.desiredOutcome.trim() &&
        item.supportInstructions.trim(),
    );

  return (
    <>
      <Stack.Screen options={{ title: "Care plan" }} />
      <ScreenContainer keyboardShouldPersistTaps="handled">
        {resident.data ? (
          <ResidentWorkspaceHeader
            resident={resident.data}
            active="care-plan"
          />
        ) : null}
        {!isManager && query.data ? (
          <Card
            style={{
              marginBottom: 14,
              borderLeftWidth: 3,
              borderLeftColor: colors.status.good,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
            >
              <CheckCircle2 size={20} color={colors.status.good} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                  Current approved care plan
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                    marginTop: 2,
                  }}
                >
                  Version {query.data.version}
                  {query.data.effectiveFrom
                    ? ` · effective ${new Date(query.data.effectiveFrom).toLocaleDateString()}`
                    : ""}
                </Text>
              </View>
            </View>
            {query.data.reviewDueAt ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                <CalendarClock size={15} color={colors.secondary} />
                <Text
                  style={{ ...typography.caption, color: colors.secondary }}
                >
                  Review due{" "}
                  {new Date(query.data.reviewDueAt).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
          </Card>
        ) : null}
        {!isManager && !query.data ? (
          <EmptyState
            icon={ClipboardList}
            title="No care plan available"
            description="A manager has not published this resident’s care plan yet."
          />
        ) : null}
        {isManager && recommendations.data?.recommendations.length ? (
          <Card
            style={{
              marginBottom: 14,
              borderLeftWidth: 3,
              borderLeftColor: colors.status.watch,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Lightbulb size={20} color={colors.status.watch} />
              <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                Care-plan review suggested
              </Text>
            </View>
            {recommendations.data.recommendations.map((item) => (
              <View key={item.id} style={{ marginTop: 12 }}>
                <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                  {item.title}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                    marginTop: 4,
                  }}
                >
                  {item.reason}
                </Text>
                <Text
                  style={{
                    ...typography.label,
                    color: colors.primary,
                    marginTop: 5,
                  }}
                >
                  Evidence available · manager approval required
                </Text>
              </View>
            ))}
            <Pressable
              disabled={draftMutation.isPending}
              onPress={() => draftMutation.mutate()}
              style={{
                minHeight: 48,
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 7,
                marginTop: 16,
              }}
            >
              <Sparkles size={18} color="#FFF" />
              <Text style={{ ...typography.bodyMedium, color: "#FFF" }}>
                {draftMutation.isPending
                  ? "Preparing…"
                  : "Create editable draft"}
              </Text>
            </Pressable>
          </Card>
        ) : null}
        {sections.map((section, index) => (
          <Card
            key={`${index}-${section.category}`}
            style={{ marginBottom: 14 }}
          >
            {isManager ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => update(index, { category })}
                    style={{
                      borderRadius: radius.full,
                      paddingHorizontal: 9,
                      paddingVertical: 6,
                      backgroundColor:
                        section.category === category
                          ? `${colors.primary}28`
                          : colors.surfaceElevated,
                      borderWidth: 1,
                      borderColor:
                        section.category === category
                          ? colors.primary
                          : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color:
                          section.category === category
                            ? colors.primary
                            : colors.secondary,
                      }}
                    >
                      {category.replaceAll("_", " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ShieldCheck size={19} color={colors.primary} />
                <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                  {section.category.replaceAll("_", " ")}
                </Text>
              </View>
            )}
            {[
              ["Assessed need", "assessedNeed"],
              ["Desired outcome", "desiredOutcome"],
              ["Preferences and routines", "preferences"],
              ["How staff should support", "supportInstructions"],
              ["Risks and safeguards", "risks"],
            ]
              .filter(
                ([, field]) =>
                  isManager ||
                  Boolean(section[field as keyof CarePlanSectionDto]),
              )
              .map(([label, field]) => (
                <View key={field} style={{ marginTop: 10 }}>
                  <Text
                    style={{ ...typography.label, color: colors.secondary }}
                  >
                    {label}
                  </Text>
                  {isManager ? (
                    <TextInput
                      multiline
                      value={String(
                        section[field as keyof CarePlanSectionDto] ?? "",
                      )}
                      onChangeText={(value) =>
                        update(index, { [field]: value })
                      }
                      style={inputStyle}
                      placeholder={label}
                      placeholderTextColor={colors.secondary}
                    />
                  ) : (
                    <View
                      style={{
                        marginTop: 5,
                        borderRadius: radius.sm,
                        padding:
                          field === "supportInstructions" || field === "risks"
                            ? 10
                            : 0,
                        backgroundColor:
                          field === "supportInstructions"
                            ? `${colors.primary}10`
                            : field === "risks"
                              ? colors.statusBg.watch
                              : "transparent",
                      }}
                    >
                      <Text style={{ ...typography.body, color: colors.text }}>
                        {String(section[field as keyof CarePlanSectionDto])}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            {isManager && section.supportInstructions.trim() ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: `/residents/${id}/create-task`,
                    params: {
                      title: section.category
                        .replaceAll("_", " ")
                        .toLowerCase(),
                      category: section.category,
                      instructions: section.supportInstructions,
                    },
                  })
                }
                style={{
                  minHeight: 44,
                  borderRadius: radius.md,
                  backgroundColor: `${colors.primary}12`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 12,
                }}
              >
                <Text
                  style={{ ...typography.bodyMedium, color: colors.primary }}
                >
                  Create task from this section
                </Text>
              </Pressable>
            ) : null}
            {isManager ? (
              <Pressable
                onPress={() =>
                  setSections((items) =>
                    items.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                style={{
                  flexDirection: "row",
                  gap: 6,
                  alignItems: "center",
                  marginTop: 14,
                }}
              >
                <Trash2 size={16} color={colors.status.critical} />
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.status.critical,
                  }}
                >
                  Remove section
                </Text>
              </Pressable>
            ) : null}
          </Card>
        ))}
        {isManager ? (
          <>
            <Pressable
              onPress={() => router.push(`/residents/${id}/create-task`)}
              style={{
                minHeight: 48,
                borderRadius: radius.md,
                backgroundColor: `${colors.primary}16`,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 7,
                marginBottom: 12,
              }}
            >
              <ClipboardList size={18} color={colors.primary} />
              <Text style={{ ...typography.bodyMedium, color: colors.primary }}>
                Create task for this resident
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSections((items) => [...items, emptySection()])}
              style={{
                minHeight: 46,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 7,
              }}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={{ ...typography.bodyMedium, color: colors.primary }}>
                Add care-plan section
              </Text>
            </Pressable>
            <Text
              style={{
                ...typography.label,
                color: colors.secondary,
                marginTop: 18,
              }}
            >
              Reason for this version
            </Text>
            <TextInput
              value={changeReason}
              onChangeText={setChangeReason}
              style={inputStyle}
              placeholder="What changed and why?"
              placeholderTextColor={colors.secondary}
            />
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: 14,
                marginBottom: 24,
              }}
            >
              <Pressable
                disabled={!valid || mutation.isPending}
                onPress={() => mutation.mutate("DRAFT")}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  opacity: valid ? 1 : 0.45,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ ...typography.bodyMedium, color: colors.primary }}
                >
                  Save draft
                </Text>
              </Pressable>
              <Pressable
                disabled={!valid || mutation.isPending}
                onPress={() => mutation.mutate("ACTIVE")}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radius.md,
                  backgroundColor: colors.primary,
                  opacity: valid ? 1 : 0.45,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Save size={17} color={colors.background} />
                <Text
                  style={{ ...typography.bodyMedium, color: colors.background }}
                >
                  Publish
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScreenContainer>
    </>
  );
}
