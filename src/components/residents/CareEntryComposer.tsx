import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  Switch,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react-native";
import { PenielAiIcon } from "@/src/components/brand/PenielAiIcon";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useResolvedTheme } from "@/src/theme/theme-provider";
import { useAuthStore } from "@/src/stores/auth-store";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import { MIN_TOUCH_TARGET } from "@/src/constants/app";
import {
  createCareEntry,
  extractCareEntry,
  updateCareEntry,
} from "@/src/services/care-entries.api";
import {
  CARE_ENTRY_CATEGORY_OPTIONS,
  userCanCreateCareNotes,
  type CareEntryCategory,
  type CareEntryDto,
  type CareEntryItemDto,
  type CareObservationDto,
} from "@/src/types/care-entry.types";

interface DraftItem {
  key: string;
  category: CareEntryCategory;
  summary: string;
}

interface CareEntryComposerProps {
  residentId: string;
  editingEntry?: CareEntryDto | null;
  onCancelEdit?: () => void;
  initialHandover?: boolean;
}

export function CareEntryComposer({
  residentId,
  editingEntry = null,
  onCancelEdit,
  initialHandover = false,
}: CareEntryComposerProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canCreate = userCanCreateCareNotes(user?.role, user?.permissions);
  const keySeq = useRef(0);
  const [rawText, setRawText] = useState("");
  const [step, setStep] = useState<"compose" | "review">("compose");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [extractedItems, setExtractedItems] = useState<CareEntryItemDto[]>([]);
  const [usedOpenAI, setUsedOpenAI] = useState(false);
  const [model, setModel] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [observations, setObservations] = useState<CareObservationDto[]>([]);
  const [extractedObservations, setExtractedObservations] = useState<
    CareObservationDto[]
  >([]);
  const [handoverRequired, setHandoverRequired] = useState(initialHandover);

  const nextKey = () => {
    keySeq.current += 1;
    return `item-${keySeq.current}`;
  };

  const inputStyle = {
    minHeight: 96,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: theme === "dark" ? "rgba(255,255,255,0.04)" : "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    ...typography.body,
    textAlignVertical: "top" as const,
  };

  const resetComposer = () => {
    setRawText("");
    setDraftItems([]);
    setExtractedItems([]);
    setExtractedObservations([]);
    setUsedOpenAI(false);
    setModel(null);
    setStep("compose");
    setFormError(null);
    setChangeReason("");
    setObservations([]);
    setHandoverRequired(initialHandover);
    onCancelEdit?.();
  };

  useEffect(() => {
    if (!editingEntry) return;
    setFormError(null);
    setChangeReason("");
    setRawText(editingEntry.rawText);
    setDraftItems(
      editingEntry.confirmedItems.map((item) => ({
        key: nextKey(),
        category: item.category,
        summary: item.summary,
      })),
    );
    setExtractedItems(editingEntry.extractedItems ?? []);
    setUsedOpenAI(false);
    setModel(null);
    setObservations(editingEntry.confirmedObservations ?? []);
    setExtractedObservations(editingEntry.extractedObservations ?? []);
    setHandoverRequired(editingEntry.handoverRequired ?? false);
    setStep("review");
  }, [editingEntry]);

  const extractMutation = useMutation({
    mutationFn: () => extractCareEntry(residentId, rawText.trim()),
    onSuccess: (result) => {
      setFormError(null);
      setExtractedItems(result.items);
      setDraftItems(
        result.items.map((item) => ({
          key: nextKey(),
          category: item.category,
          summary: item.summary,
        })),
      );
      setUsedOpenAI(result.usedOpenAI);
      setModel(result.model);
      setObservations(result.observations ?? []);
      setExtractedObservations(result.observations ?? []);
      setStep("review");
    },
    onError: (error) => {
      setFormError(normalizeApiError(error));
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      createCareEntry(residentId, {
        rawText: rawText.trim(),
        items: draftItems.map((item) => ({
          category: item.category,
          summary: item.summary.trim(),
        })),
        extractedItems,
        usedOpenAI,
        model,
        observations,
        extractedObservations,
        handoverRequired,
      }),
    onSuccess: async () => {
      resetComposer();
      await queryClient.invalidateQueries({
        queryKey: ["carehome", "care-entries", residentId],
      });
    },
    onError: (error) => {
      setFormError(normalizeApiError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingEntry) throw new Error("No note selected");
      return updateCareEntry(residentId, editingEntry.id, {
        rawText: rawText.trim(),
        items: draftItems.map((item) => ({
          category: item.category,
          summary: item.summary.trim(),
        })),
        changeReason: changeReason.trim(),
        observations,
        handoverRequired,
      });
    },
    onSuccess: async () => {
      resetComposer();
      await queryClient.invalidateQueries({
        queryKey: ["carehome", "care-entries", residentId],
      });
    },
    onError: (error) => {
      setFormError(normalizeApiError(error));
    },
  });

  const canExtract = rawText.trim().length >= 3 && !extractMutation.isPending;
  const hasFluidItem = draftItems.some((item) => item.category === "FLUID");
  const fluidObservationIndex = observations.findIndex(
    (observation) => observation.kind === "FLUID_INTAKE" && observation.unit === "ML",
  );
  const saving = saveMutation.isPending || updateMutation.isPending;
  const editingId = editingEntry?.id ?? null;
  const canSave =
    rawText.trim().length > 0 &&
    draftItems.length > 0 &&
    draftItems.every((item) => item.summary.trim().length > 0) &&
    (!hasFluidItem || fluidObservationIndex >= 0) &&
    (!editingId || changeReason.trim().length >= 3) &&
    !saving;

  if (!canCreate) {
    return (
      <Text style={{ ...typography.caption, color: colors.secondary }}>
        You can view care notes. Logging, editing, or deleting notes needs
        permission.
      </Text>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {step === "compose" ? (
        <>
          <TextInput
            value={rawText}
            onChangeText={setRawText}
            placeholder="e.g. Had a shower, ate most of lunch, seemed a bit withdrawn."
            placeholderTextColor={colors.secondary}
            multiline
            maxLength={4000}
            style={inputStyle}
          />
          <PrimaryAction
            label="Extract"
            pending={extractMutation.isPending}
            disabled={!canExtract}
            onPress={() => extractMutation.mutate()}
            icon={<PenielAiIcon size={20} variant="onColor" color="#FFFFFF" />}
          />
        </>
      ) : (
        <>
          <View
            style={{
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              backgroundColor:
                theme === "dark" ? "rgba(255,255,255,0.04)" : colors.background,
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.secondary,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Original wording
            </Text>
            {editingId ? (
              <TextInput
                value={rawText}
                onChangeText={setRawText}
                multiline
                maxLength={4000}
                style={{ ...inputStyle, minHeight: 72, marginTop: 8 }}
              />
            ) : (
              <Text
                style={{ ...typography.body, color: colors.text, marginTop: 6 }}
              >
                {rawText}
              </Text>
            )}
          </View>
          <Text style={{ ...typography.caption, color: colors.secondary }}>
            {editingId
              ? "Update the wording and categories, then save."
              : usedOpenAI
                ? "Check each item, then confirm. Edit anything that is wrong before saving."
                : "Saved as a general update. Split or recategorise if needed, then confirm."}
          </Text>

          {draftItems.map((item) => (
            <View
              key={item.key}
              style={{
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CARE_ENTRY_CATEGORY_OPTIONS.map((option) => {
                  const selected = option.value === item.category;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        setDraftItems((current) =>
                          current.map((row) =>
                            row.key === item.key
                              ? { ...row, category: option.value }
                              : row,
                          ),
                        )
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option.label}
                      style={{
                        minHeight: 32,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: radius.full,
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected
                          ? `${colors.primary}22`
                          : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          ...typography.caption,
                          fontWeight: "600",
                          color: selected ? colors.primary : colors.secondary,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={item.summary}
                onChangeText={(value) =>
                  setDraftItems((current) =>
                    current.map((row) =>
                      row.key === item.key ? { ...row, summary: value } : row,
                    ),
                  )
                }
                multiline
                maxLength={500}
                style={{ ...inputStyle, minHeight: 64 }}
              />
              <Pressable
                onPress={() =>
                  setDraftItems((current) =>
                    current.filter((row) => row.key !== item.key),
                  )
                }
                disabled={draftItems.length <= 1}
                accessibilityRole="button"
                accessibilityLabel="Remove item"
                style={{
                  alignSelf: "flex-start",
                  minHeight: MIN_TOUCH_TARGET,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: draftItems.length <= 1 ? 0.4 : 1,
                }}
              >
                <Trash2 size={16} color={colors.status.critical} />
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.status.critical,
                  }}
                >
                  Remove
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() =>
              setDraftItems((current) => [
                ...current,
                {
                  key: nextKey(),
                  category: "GENERAL_WELLBEING",
                  summary: "",
                },
              ])
            }
            accessibilityRole="button"
            accessibilityLabel="Add category"
            style={{
              minHeight: MIN_TOUCH_TARGET,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={16} color={colors.primary} />
            <Text
              style={{
                ...typography.caption,
                fontWeight: "600",
                color: colors.primary,
              }}
            >
              Add category
            </Text>
          </Pressable>

          {hasFluidItem ? (
            <View
              style={{
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: fluidObservationIndex >= 0 ? colors.primary : colors.status.watch,
                backgroundColor: fluidObservationIndex >= 0 ? `${colors.primary}0D` : colors.statusBg.watch,
                padding: 12,
                gap: 8,
              }}
            >
              <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                How much fluid was taken?
              </Text>
              <Text style={{ ...typography.caption, color: colors.secondary }}>
                Enter the amount actually taken in ml. Enter 0 if none was taken or the drink was declined.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                <TextInput
                  value={fluidObservationIndex >= 0 ? String(observations[fluidObservationIndex].value) : ""}
                  onChangeText={(value) => {
                    const cleaned = value.replace(/[^0-9.]/g, "");
                    if (!cleaned) {
                      setObservations((rows) => rows.filter((row) => !(row.kind === "FLUID_INTAKE" && row.unit === "ML")));
                      return;
                    }
                    const next = { kind: "FLUID_INTAKE" as const, value: Number(cleaned), unit: "ML" as const, label: "Fluid taken" };
                    setObservations((rows) => fluidObservationIndex >= 0 ? rows.map((row, index) => index === fluidObservationIndex ? next : row) : [...rows, next]);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 250"
                  placeholderTextColor={colors.secondary}
                  accessibilityLabel="Fluid taken in millilitres"
                  style={{ ...inputStyle, minHeight: 46, width: 112, textAlignVertical: "center", textAlign: "center" }}
                />
                <Text style={{ ...typography.bodyMedium, color: colors.text }}>ml taken</Text>
              </View>
            </View>
          ) : null}

          {observations.length ? (
            <View
              style={{
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}0D`,
                padding: 12,
                gap: 10,
              }}
            >
              <View>
                <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                  Check the recorded details
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                    marginTop: 3,
                  }}
                >
                  These details help Peniel Care notice changes over time.
                  Correct or remove anything that is wrong.
                </Text>
              </View>
              {observations.map((observation, index) => observation.kind === "FLUID_INTAKE" && hasFluidItem ? null : (
                <View
                  key={`${observation.kind}-${index}`}
                  style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
                >
                  <TextInput
                    value={String(observation.value)}
                    onChangeText={(value) =>
                      setObservations((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                value:
                                  Number(value.replace(/[^0-9.]/g, "")) || 0,
                              }
                            : row,
                        ),
                      )
                    }
                    keyboardType="decimal-pad"
                    accessibilityLabel={`${observation.label} amount`}
                    style={{
                      ...inputStyle,
                      minHeight: 44,
                      width: 76,
                      textAlignVertical: "center",
                      textAlign: "center",
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.caption, color: colors.text }}>
                      {observation.label}
                    </Text>
                    <Text
                      style={{ ...typography.label, color: colors.secondary }}
                    >
                      {observation.unit === "ML"
                        ? "ml"
                        : observation.unit.toLowerCase()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      setObservations((rows) =>
                        rows.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                    accessibilityLabel={`Remove ${observation.label}`}
                  >
                    <Trash2 size={17} color={colors.status.critical} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: handoverRequired ? colors.primary : colors.border,
                borderRadius: radius.md,
                backgroundColor: handoverRequired
                  ? `${colors.primary}12`
                  : "transparent",
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                  Highlight for handover
                </Text>
                <Text
                  style={{ ...typography.caption, color: colors.secondary }}
                >
                  Show this update prominently to the next shift.
                </Text>
              </View>
              <Switch
                value={handoverRequired}
                onValueChange={setHandoverRequired}
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}88`,
                }}
                thumbColor={
                  handoverRequired ? colors.primary : colors.secondary
                }
                accessibilityLabel="Highlight for handover"
              />
            </View>
            {editingId ? (
              <>
                <Text style={{ ...typography.label, color: colors.secondary }}>
                  Reason for correction
                </Text>
                <TextInput
                  value={changeReason}
                  onChangeText={setChangeReason}
                  placeholder="Briefly explain what was corrected"
                  placeholderTextColor={colors.secondary}
                  maxLength={500}
                  style={{ ...inputStyle, minHeight: 56 }}
                />
              </>
            ) : null}
            <PrimaryAction
              label={editingId ? "Save changes" : "Confirm & save"}
              pending={saving}
              disabled={!canSave}
              onPress={() =>
                editingId ? updateMutation.mutate() : saveMutation.mutate()
              }
            />
            <Pressable
              onPress={() => {
                if (editingId) {
                  resetComposer();
                  return;
                }
                setStep("compose");
              }}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={editingId ? "Cancel" : "Edit original"}
              style={{
                minHeight: MIN_TOUCH_TARGET,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  fontWeight: "600",
                  color: colors.secondary,
                }}
              >
                {editingId ? "Cancel" : "Edit original"}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {formError ? (
        <Text style={{ ...typography.caption, color: colors.status.critical }}>
          {formError}
        </Text>
      ) : null}
    </View>
  );
}

function PrimaryAction({
  label,
  pending,
  disabled,
  onPress,
  icon,
}: {
  label: string;
  pending: boolean;
  disabled: boolean;
  onPress: () => void;
  icon?: ReactNode;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: MIN_TOUCH_TARGET,
        borderRadius: radius.button,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        paddingHorizontal: 16,
      }}
    >
      {pending ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {icon}
          <Text
            style={{
              ...typography.bodyMedium,
              color: "#FFFFFF",
              fontWeight: "600",
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
