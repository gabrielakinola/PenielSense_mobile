import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Pill,
  ShieldCheck,
  Wifi,
} from "lucide-react-native";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import {
  getMedicationRounds,
  getMedicationStock,
  getMedicationWitnesses,
  recordMedicationAdministration,
} from "@/src/services/emar.api";
import { getCareHomeResidents } from "@/src/services/residents.api";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import type { MedicationOutcome, MedicationSlot } from "@/src/types/emar.types";
import { useAuthStore } from "@/src/stores/auth-store";

const dateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export default function MedicationScreen() {
  const colors = useThemeColors();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [selected, setSelected] = useState<MedicationSlot | null>(null);
  const [sortBy, setSortBy] = useState<"room" | "name">("room");
  const rounds = useQuery({
    queryKey: ["emar", "rounds", dateKey()],
    queryFn: () => getMedicationRounds(dateKey()),
  });
  const residents = useQuery({
    queryKey: ["carehome", "residents", "emar"],
    queryFn: () => getCareHomeResidents(),
  });
  const witnesses = useQuery({
    queryKey: ["emar", "witnesses"],
    queryFn: getMedicationWitnesses,
  });
  const names = useMemo(
    () =>
      new Map(
        (residents.data ?? []).map((r) => [
          r.id,
          r.preferredName || r.fullName,
        ]),
      ),
    [residents.data],
  );
  const rows = useMemo(() => {
    const ids = new Set([...(rounds.data?.slots.map((x) => x.order.residentId) ?? []), ...(rounds.data?.prnOrders.map((x) => x.residentId) ?? [])]);
    return [...ids].map((id) => ({ resident: residents.data?.find((x) => x.id === id), id, slots: rounds.data?.slots.filter((x) => x.order.residentId === id) ?? [] }))
      .sort((a, b) => sortBy === "name" ? (a.resident?.fullName ?? "").localeCompare(b.resident?.fullName ?? "") : (a.resident?.roomNo ?? "").localeCompare(b.resident?.roomNo ?? "", undefined, { numeric: true }));
  }, [rounds.data, residents.data, sortBy]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Medication round" />
      <ScreenContainer scroll={false} padded={false}>
        <FlatList
          data={rows}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshing={rounds.isRefetching}
          onRefresh={() => rounds.refetch()}
          ListHeaderComponent={
            <View style={{ marginBottom: 14 }}>
              <Text style={{ ...typography.title, color: colors.text }}>
                Today’s rounds
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  alignItems: "center",
                  marginTop: 6,
                }}
              >
                <Wifi size={14} color={colors.secondary} />
                <Text
                  style={{ ...typography.caption, color: colors.secondary }}
                >
                  A live connection is required before a MAR outcome is saved.
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {([['room','Room order'],['name','A–Z']] as const).map(([value,label]) => <Pressable key={value} onPress={() => setSortBy(value)} style={{ borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: sortBy === value ? colors.primary : colors.surfaceElevated }}><Text style={{ ...typography.label, color: sortBy === value ? '#FFF' : colors.secondary }}>{label}</Text></Pressable>)}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon={Pill}
              title="No medicines due"
              description={
                rounds.isError
                  ? normalizeApiError(rounds.error)
                  : "There are no scheduled medication slots today."
              }
            />
          }
          renderItem={({ item }) => <ResidentMedicationCard row={item} onSelect={setSelected} />}
          ListFooterComponent={
            rounds.data?.prnOrders.length ? (
              <View style={{ marginTop: 6 }}>
                <Text
                  style={{
                    ...typography.heading,
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  PRN medicines
                </Text>
                {rounds.data.prnOrders.map((o) => (
                  <Card key={o._id} style={{ marginBottom: 10 }}>
                    <Text
                      style={{ ...typography.bodyMedium, color: colors.text }}
                    >
                      {names.get(o.residentId) ?? "Resident"} · {o.medicineName}{" "}
                      {o.dose}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: colors.secondary,
                        marginTop: 4,
                      }}
                    >
                      {o.prnProtocol}
                    </Text>
                    <Pressable
                      onPress={() => {
                        const now = new Date().toISOString();
                        setSelected({
                          order: o,
                          scheduledAt: now,
                          slotKey: `${o._id}:prn:${Date.now()}-${userId}`,
                          administration: null,
                        });
                      }}
                      style={{
                        marginTop: 10,
                        minHeight: 44,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          ...typography.bodyMedium,
                          color: colors.primary,
                        }}
                      >
                        Record PRN administration
                      </Text>
                    </Pressable>
                  </Card>
                ))}
              </View>
            ) : null
          }
        />
      </ScreenContainer>
      {selected ? (
        <OutcomeModal
          slot={selected}
          witnesses={(witnesses.data ?? []).filter((x) => x.id !== userId)}
          close={() => setSelected(null)}
          saved={async () => {
            setSelected(null);
            await qc.invalidateQueries({ queryKey: ["emar"] });
          }}
        />
      ) : null}
    </View>
  );
}

function ResidentMedicationCard({ row, onSelect }: { row: { resident?: { fullName: string; preferredName?: string | null; roomNo: string }; slots: MedicationSlot[] }; onSelect: (slot: MedicationSlot) => void }) {
  const colors = useThemeColors();
  const periods = ['Morning', 'Midday', 'Evening', 'Night'] as const;
  const period = (iso: string) => { const hour = Number(iso.slice(11, 13)); return hour < 11 ? 'Morning' : hour < 15 ? 'Midday' : hour < 20 ? 'Evening' : 'Night'; };
  return <Card style={{ marginBottom: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#E8ECFF', alignItems: 'center', justifyContent: 'center' }}><Text style={{ ...typography.heading, color: colors.primary }}>{(row.resident?.preferredName || row.resident?.fullName || 'R').slice(0, 1)}</Text></View><View><Text style={{ ...typography.heading, color: colors.text }}>{row.resident?.preferredName || row.resident?.fullName || 'Resident'}</Text><Text style={{ ...typography.caption, color: colors.secondary }}>Room {row.resident?.roomNo || '—'}</Text></View></View>
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 13 }}>{periods.map((label) => { const slots = row.slots.filter((x) => period(x.scheduledAt) === label); const done = slots.filter((x) => x.administration && !x.administration.voided).length; const late = slots.some((x) => !x.administration && new Date(x.scheduledAt).getTime() < Date.now() - 60 * 60 * 1000); const next = slots.find((x) => !x.administration); const tint = !slots.length ? colors.secondary : done === slots.length ? colors.status.good : late ? '#E5484D' : colors.primary; return <Pressable key={label} disabled={!next} onPress={() => next && onSelect(next)} accessibilityLabel={`${label}, ${done} of ${slots.length} given`} style={{ flex: 1, minHeight: 65, borderRadius: radius.md, backgroundColor: !slots.length ? colors.surfaceElevated : `${tint}12`, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>{done === slots.length && slots.length ? <CheckCircle2 size={18} color={tint} /> : <Clock3 size={18} color={tint} />}<Text style={{ ...typography.label, color: tint, marginTop: 3 }}>{slots.length ? `${done}/${slots.length}` : '—'}</Text><Text numberOfLines={1} style={{ fontSize: 10, color: colors.secondary }}>{label}</Text></Pressable>; })}</View>
  </Card>;
}

function OutcomeModal({
  slot,
  witnesses,
  close,
  saved,
}: {
  slot: MedicationSlot;
  witnesses: Array<{ id: string; firstName: string; lastName: string }>;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const colors = useThemeColors();
  const [outcome, setOutcome] = useState<MedicationOutcome>(
    slot.order.prn ? "PRN_GIVEN" : "GIVEN",
  );
  const [reason, setReason] = useState(
    slot.order.prn ? "Administered in line with PRN protocol" : "",
  );
  const [note, setNote] = useState("");
  const [witness, setWitness] = useState("");
  const stock = useQuery({ queryKey: ["emar", "stock", slot.order._id], queryFn: () => getMedicationStock(slot.order._id) });
  const stockBefore = stock.data?.[0]?.quantity;
  const mutation = useMutation({
    mutationFn: () =>
      recordMedicationAdministration(slot.order._id, {
        slotKey: slot.slotKey,
        scheduledAt: slot.scheduledAt,
        outcome,
        reason,
        note,
        witnessUserId: witness || undefined,
      }),
    onSuccess: saved,
    onError: (e) =>
      Alert.alert("Could not save medication record", normalizeApiError(e)),
  });
  return (
    <Modal transparent animationType="slide" onRequestClose={close}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(15,23,42,.35)",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
          }}
        >
          <Text style={{ ...typography.heading, color: colors.text }}>
            {slot.order.medicineName} · {slot.order.dose}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: colors.secondary,
              marginTop: 3,
            }}
          >
            This creates a permanent MAR record.
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }}><View style={{ flex: 1 }}><Text style={{ ...typography.caption, color: colors.secondary }}>Stock before</Text><Text style={{ ...typography.bodyMedium, color: colors.text }}>{stockBefore ?? "Not counted"}</Text></View><View style={{ flex: 1 }}><Text style={{ ...typography.caption, color: colors.secondary }}>Estimated after</Text><Text style={{ ...typography.bodyMedium, color: colors.text }}>{typeof stockBefore === "number" && outcome === "GIVEN" ? stockBefore - 1 : stockBefore ?? "—"}</Text></View></View>
          {slot.order.prn ? (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceElevated,
              }}
            >
              <Text style={{ ...typography.label, color: colors.status.watch }}>
                PRN PROTOCOL
              </Text>
              <Text
                style={{ ...typography.body, color: colors.text, marginTop: 4 }}
              >
                {slot.order.prnProtocol}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16,
              }}
            >
              {(
                [
                  "GIVEN",
                  "REFUSED",
                  "OMITTED",
                  "NOT_AVAILABLE",
                ] as MedicationOutcome[]
              ).map((x) => (
                <Pressable
                  key={x}
                  onPress={() => setOutcome(x)}
                  style={{
                    paddingHorizontal: 12,
                    minHeight: 42,
                    justifyContent: "center",
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: outcome === x ? colors.primary : colors.border,
                    backgroundColor:
                      outcome === x ? colors.surfaceElevated : "transparent",
                  }}
                >
                  <Text
                    style={{
                      ...typography.label,
                      color: outcome === x ? colors.primary : colors.text,
                    }}
                  >
                    {x.replace("_", " ")}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {!slot.order.prn && outcome !== "GIVEN" ? (
            <TextInput
              placeholder="Reason (required)"
              placeholderTextColor={colors.secondary}
              value={reason}
              onChangeText={setReason}
              multiline
              style={{
                marginTop: 12,
                minHeight: 72,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: 12,
                color: colors.text,
              }}
            />
          ) : null}
          <TextInput
            placeholder={
              slot.order.prn
                ? "Reason for giving and resident presentation"
                : "Optional note"
            }
            placeholderTextColor={colors.secondary}
            value={note}
            onChangeText={setNote}
            multiline
            style={{
              marginTop: 12,
              minHeight: 64,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: 12,
              color: colors.text,
            }}
          />
          {slot.order.controlledDrug ? (
            <View style={{ marginTop: 12 }}>
              <Text
                style={{
                  ...typography.label,
                  color: colors.secondary,
                  marginBottom: 6,
                }}
              >
                WITNESS
              </Text>
              {witnesses.map((x) => (
                <Pressable
                  key={x.id}
                  onPress={() => setWitness(x.id)}
                  style={{
                    padding: 11,
                    borderWidth: 1,
                    borderColor:
                      witness === x.id ? colors.primary : colors.border,
                    borderRadius: radius.md,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.text }}>
                    {x.firstName} {x.lastName}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <Pressable
              onPress={close}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ ...typography.bodyMedium, color: colors.secondary }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              disabled={
                mutation.isPending ||
                (!slot.order.prn && outcome !== "GIVEN" && !reason.trim()) ||
                (slot.order.controlledDrug && !witness)
              }
              onPress={() => mutation.mutate()}
              style={{
                flex: 2,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                opacity: mutation.isPending ? 0.5 : 1,
              }}
            >
              <Text style={{ ...typography.bodyMedium, color: "#FFF" }}>
                Confirm MAR record
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
