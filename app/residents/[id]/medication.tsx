import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pill, ShieldAlert } from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import {
  getMar,
  getMedicationOrders,
  recordMar,
} from "@/src/services/medication.api";
import type {
  MarOutcome,
  MedicationOrderDto,
} from "@/src/types/medication.types";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
export default function MedicationScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const qc = useQueryClient();
  const orders = useQuery({
    queryKey: ["carehome", "medication-orders", id],
    queryFn: () => getMedicationOrders(id),
    enabled: !!id,
  });
  const mar = useQuery({
    queryKey: ["carehome", "mar", id],
    queryFn: () => getMar(id),
    enabled: !!id,
  });
  const [selected, setSelected] = useState<MedicationOrderDto | null>(null);
  const [outcome, setOutcome] = useState<MarOutcome>("GIVEN");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [slot, setSlot] = useState("");
  const submit = useMutation({
    mutationFn: () =>
      recordMar(selected!.id, {
        outcome,
        doseRecorded: selected!.dose,
        scheduledFor: slot || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        prnIndicationObserved: outcome === "PRN_GIVEN" ? reason : undefined,
      }),
    onSuccess: async () => {
      Alert.alert("Recorded", "Medication outcome signed in the MAR.");
      setSelected(null);
      setReason("");
      setNotes("");
      await qc.invalidateQueries({ queryKey: ["carehome", "mar", id] });
    },
    onError: (e) => Alert.alert("Could not record", normalizeApiError(e)),
  });
  const input = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    marginTop: 7,
  } as const;
  return (
    <>
      <Stack.Screen options={{ title: "Medication and MAR" }} />
      <ScreenContainer keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", gap: 9, alignItems: "center" }}>
          <Pill size={23} color={colors.primary} />
          <Text style={{ ...typography.title, color: colors.text }}>
            Medication and MAR
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginVertical: 14,
            padding: 12,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceElevated,
          }}
        >
          <ShieldAlert size={18} color={colors.status.watch} />
          <Text
            style={{ ...typography.caption, color: colors.secondary, flex: 1 }}
          >
            Online safety record. Check the authorised MAR and medicine before
            signing. Medication entries are not queued offline.
          </Text>
        </View>
        {orders.isLoading ? (
          <SkeletonCard lines={5} />
        ) : (
          orders.data?.map((o) => (
            <Card key={o.id} style={{ marginBottom: 11 }}>
              <Text style={{ ...typography.heading, color: colors.text }}>
                {o.name} {o.strength}
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: colors.secondary,
                  marginTop: 4,
                }}
              >
                {o.dose} · {o.route} ·{" "}
                {o.prn ? "PRN" : o.scheduleTimes.join(", ")}
              </Text>
              {o.instructions ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                    marginTop: 7,
                  }}
                >
                  {o.instructions}
                </Text>
              ) : null}
              <Pressable
                onPress={() => {
                  setSelected(o);
                  setOutcome(o.prn ? "PRN_GIVEN" : "GIVEN");
                  setSlot("");
                }}
                style={{
                  marginTop: 12,
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ ...typography.bodyMedium, color: "#fff" }}>
                  Record outcome
                </Text>
              </Pressable>
            </Card>
          ))
        )}
        {selected ? (
          <Card style={{ marginBottom: 14 }}>
            <Text style={{ ...typography.heading, color: colors.text }}>
              Sign: {selected.name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 7,
                marginTop: 12,
              }}
            >
              {((selected.prn
                ? ["PRN_GIVEN", "REFUSED", "OMITTED", "NOT_AVAILABLE"]
                : ["GIVEN", "REFUSED", "OMITTED", "NOT_AVAILABLE"]) as MarOutcome[]
              ).map((x) => (
                <Pressable
                  key={x}
                  onPress={() => setOutcome(x)}
                  style={{
                    padding: 9,
                    borderRadius: 20,
                    backgroundColor:
                      outcome === x ? colors.primary : colors.surfaceElevated,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: outcome === x ? "#fff" : colors.text,
                    }}
                  >
                    {x.replaceAll("_", " ")}
                  </Text>
                </Pressable>
              ))}
            </View>
            {!selected.prn ? (
              <>
                <Text
                  style={{
                    ...typography.label,
                    color: colors.secondary,
                    marginTop: 13,
                  }}
                >
                  SCHEDULED TIME (ISO DATE/TIME)
                </Text>
                <TextInput
                  value={slot}
                  onChangeText={setSlot}
                  placeholder="2026-09-15T08:00:00Z"
                  placeholderTextColor={colors.secondary}
                  style={input}
                />
              </>
            ) : null}
            <Text
              style={{
                ...typography.label,
                color: colors.secondary,
                marginTop: 13,
              }}
            >
              {outcome === "PRN_GIVEN"
                ? "OBSERVED INDICATION"
                : "REASON (required when not given)"}
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              style={[input, { minHeight: 70 }]}
            />
            <Text
              style={{
                ...typography.label,
                color: colors.secondary,
                marginTop: 13,
              }}
            >
              NOTES
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[input, { minHeight: 70 }]}
            />
            <Pressable
              disabled={
                submit.isPending ||
                (outcome !== "GIVEN" && !reason.trim()) ||
                (!selected.prn && !slot)
              }
              onPress={() => submit.mutate()}
              style={{
                marginTop: 14,
                backgroundColor: colors.primary,
                opacity: submit.isPending ? 0.5 : 1,
                borderRadius: radius.md,
                padding: 13,
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.bodyMedium, color: "#fff" }}>
                {submit.isPending ? "Saving…" : "Confirm and sign"}
              </Text>
            </Pressable>
          </Card>
        ) : null}
        <Text
          style={{
            ...typography.heading,
            color: colors.text,
            marginVertical: 10,
          }}
        >
          Recent MAR
        </Text>
        {mar.data?.slice(0, 20).map((x) => (
          <Card key={x.id} style={{ marginBottom: 8 }}>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>
              {x.outcome.replaceAll("_", " ")}
            </Text>
            <Text style={{ ...typography.caption, color: colors.secondary }}>
              {x.doseRecorded} ·{" "}
              {new Date(x.administeredAt).toLocaleString("en-GB")}
            </Text>
          </Card>
        ))}
      </ScreenContainer>
    </>
  );
}
