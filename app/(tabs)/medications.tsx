import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
  getResidentMedicationHistory,
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
import { BodyMap, type BodyMapMarkValue } from "@/src/components/incidents/BodyMap";
import type { ApiResidentDto } from "@/src/types/carehome.types";

const dateKey = (d = new Date()) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const parseDateKey = (value: string) => new Date(`${value}T12:00:00`);
const shiftDate = (value: string, days: number) => { const date = parseDateKey(value); date.setDate(date.getDate() + days); return dateKey(date); };
export default function MedicationScreen() {
  const colors = useThemeColors();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [selected, setSelected] = useState<MedicationSlot | null>(null);
  const [slotChoices, setSlotChoices] = useState<MedicationSlot[]>([]);
  const [sortBy, setSortBy] = useState<"room" | "name">("room");
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const rounds = useQuery({
    queryKey: ["emar", "rounds", selectedDate],
    queryFn: () => getMedicationRounds(selectedDate),
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
                {selectedDate === dateKey() ? "Today’s rounds" : `Medication rounds · ${parseDateKey(selectedDate).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}`}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
                <Pressable onPress={() => setSelectedDate((date) => shiftDate(date, -1))} accessibilityLabel="Previous day" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }}><ChevronLeft size={20} color={colors.text}/></Pressable>
                <Pressable onPress={() => setCalendarOpen(true)} style={{ flex: 1, minHeight: 44, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }}><CalendarDays size={18} color={colors.primary}/><Text style={{ ...typography.bodyMedium, color: colors.text }}>{parseDateKey(selectedDate).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</Text></Pressable>
                <Pressable onPress={() => setSelectedDate((date) => shiftDate(date, 1))} accessibilityLabel="Next day" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }}><ChevronRight size={20} color={colors.text}/></Pressable>
              </View>
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
          renderItem={({ item }) => <ResidentMedicationCard row={item} onSelect={(slots) => setSlotChoices(slots)} />}
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
      {slotChoices.length ? (
        <RoundSlotPicker
          slots={slotChoices}
          close={() => setSlotChoices([])}
          select={(slot) => {
            setSlotChoices([]);
            setSelected(slot);
          }}
        />
      ) : null}
      {calendarOpen ? <MedicationCalendar value={selectedDate} close={() => setCalendarOpen(false)} select={(date) => { setSelectedDate(date); setCalendarOpen(false); }} /> : null}
    </View>
  );
}

function ResidentMedicationCard({ row, onSelect }: { row: { resident?: ApiResidentDto; slots: MedicationSlot[] }; onSelect: (slots: MedicationSlot[]) => void }) {
  const colors = useThemeColors();
  const periods = ['Morning', 'Midday', 'Evening', 'Night'] as const;
  const period = (iso: string) => { const hour = Number(iso.slice(11, 13)); return hour < 11 ? 'Morning' : hour < 15 ? 'Midday' : hour < 20 ? 'Evening' : 'Night'; };
  return <Card style={{ marginBottom: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 46, height: 46, borderRadius: 23, overflow:'hidden', backgroundColor: '#E8ECFF', alignItems: 'center', justifyContent: 'center' }}>{row.resident?.photoUrl ? <Image source={{ uri: row.resident.photoUrl }} style={{ width:'100%',height:'100%' }} /> : <Text style={{ ...typography.heading, color: colors.primary }}>{(row.resident?.preferredName || row.resident?.fullName || 'R').slice(0, 1)}</Text>}</View><View><Text style={{ ...typography.heading, color: colors.text }}>{row.resident?.preferredName || row.resident?.fullName || 'Resident'}</Text><Text style={{ ...typography.caption, color: colors.secondary }}>Room {row.resident?.roomNo || '—'}</Text></View></View>
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 13 }}>{periods.map((label) => { const slots = row.slots.filter((x) => period(x.scheduledAt) === label); const done = slots.filter((x) => x.administration && !x.administration.voided).length; const late = slots.some((x) => !x.administration && new Date(x.scheduledAt).getTime() < Date.now() - 60 * 60 * 1000); const tint = !slots.length ? colors.secondary : done === slots.length ? colors.status.good : late ? '#E5484D' : colors.primary; const times=slots.map(x=>x.scheduledAt.slice(11,16)).join(', '); return <Pressable key={label} disabled={!slots.length} onPress={() => onSelect(slots)} accessibilityLabel={`${label}, ${done} of ${slots.length} recorded`} style={{ flex: 1, minHeight: 76, borderRadius: radius.md, backgroundColor: !slots.length ? colors.surfaceElevated : `${tint}12`, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>{done === slots.length && slots.length ? <CheckCircle2 size={18} color={tint} /> : <Clock3 size={18} color={tint} />}<Text style={{ ...typography.label, color: tint, marginTop: 3 }}>{slots.length ? `${done}/${slots.length}` : '—'}</Text><Text numberOfLines={1} style={{ fontSize: 10, color: colors.secondary }}>{label}</Text>{times?<Text numberOfLines={1} style={{fontSize:9,color:colors.secondary}}>{times}</Text>:null}</Pressable>; })}</View>
  </Card>;
}

function RoundSlotPicker({slots,close,select}:{slots:MedicationSlot[];close:()=>void;select:(slot:MedicationSlot)=>void}){
  const colors=useThemeColors();
  return <Modal transparent animationType="slide" onRequestClose={close}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(15,23,42,.35)'}}><View style={{maxHeight:'70%',backgroundColor:colors.background,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{...typography.heading,color:colors.text}}>Medicines in this round ({slots.length})</Text><Pressable onPress={close}><Text style={{...typography.label,color:colors.primary}}>Close</Text></Pressable></View><ScrollView style={{marginTop:12}}>{slots.map(slot=><Pressable key={slot.slotKey} disabled={!!slot.administration&&!slot.administration.voided} onPress={()=>select(slot)} style={{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,marginBottom:8,opacity:slot.administration&&!slot.administration.voided?0.6:1}}><Text style={{...typography.bodyMedium,color:colors.text}}>{slot.order.medicineName} · {slot.order.dose}</Text><Text style={{...typography.caption,color:colors.secondary,marginTop:3}}>Scheduled {slot.scheduledAt.slice(11,16)} · {slot.order.route}</Text><Text style={{...typography.label,color:slot.administration?colors.status.good:colors.primary,marginTop:6}}>{slot.administration?slot.administration.outcome.replaceAll('_',' '):'Open medication record'}</Text></Pressable>)}</ScrollView></View></View></Modal>
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
  const [stockBeforeInput, setStockBeforeInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");
  const [actualTime, setActualTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [applicationMark, setApplicationMark] = useState<BodyMapMarkValue | null>(null);
  const [bodyView, setBodyView] = useState<"FRONT" | "BACK">("FRONT");
  const stock = useQuery({ queryKey: ["emar", "stock", slot.order._id], queryFn: () => getMedicationStock(slot.order._id) });
  const history = useQuery({ queryKey: ["emar", "history", slot.order.residentId], queryFn: () => getResidentMedicationHistory(slot.order.residentId) });
  const stockBefore = stock.data?.[0]?.quantity;
  useEffect(() => { if (stockBefore !== undefined && !stockBeforeInput) setStockBeforeInput(String(stockBefore)); }, [stockBefore, stockBeforeInput]);
  const removesStock = outcome === "GIVEN" || outcome === "PRN_GIVEN" || outcome === "DESTROYED";
  const stockBeforeNumber = stockBeforeInput.trim() === "" ? undefined : Number(stockBeforeInput);
  const quantityUsed = removesStock ? Number(quantityInput) : 0;
  const estimatedAfter = stockBeforeNumber === undefined || Number.isNaN(quantityUsed) ? undefined : stockBeforeNumber - quantityUsed;
  const topical = /cream|ointment|gel|lotion|topical|cutaneous/i.test(`${slot.order.medicineName} ${slot.order.route}`);
  const previousRecords = (history.data ?? []).filter((item) => item.orderId === slot.order._id).slice(0, 5);
  const administeredAt = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(actualTime)) return undefined;
    const scheduledDay = new Date(slot.scheduledAt); const [hours, minutes] = actualTime.split(":").map(Number);
    return new Date(scheduledDay.getFullYear(), scheduledDay.getMonth(), scheduledDay.getDate(), hours, minutes).toISOString();
  };
  const mutation = useMutation({
    mutationFn: () =>
      recordMedicationAdministration(slot.order._id, {
        slotKey: slot.slotKey,
        scheduledAt: slot.scheduledAt,
        administeredAt: administeredAt(),
        outcome,
        reason,
        note,
        witnessUserId: witness || undefined,
        stockBefore: stockBeforeNumber,
        quantityUsed,
        applicationSite: applicationMark ? { view: applicationMark.view, x: applicationMark.x, y: applicationMark.y, label: "Application site" } : undefined,
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
        <ScrollView
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: "92%",
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
            Scheduled {slot.scheduledAt.slice(11, 16)}. This creates a permanent MAR record.
          </Text>
          <Text style={{...typography.label,color:colors.secondary,marginTop:14}}>TIME ACTUALLY GIVEN (24-HOUR)</Text>
          <TextInput value={actualTime} onChangeText={setActualTime} keyboardType="numbers-and-punctuation" placeholder="HH:MM" placeholderTextColor={colors.secondary} style={{marginTop:6,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:12,color:colors.text}} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }}><View style={{ flex: 1 }}><Text style={{ ...typography.caption, color: colors.secondary }}>Stock before</Text><TextInput value={stockBeforeInput} onChangeText={setStockBeforeInput} keyboardType="decimal-pad" placeholder="Enter count" placeholderTextColor={colors.secondary} style={{...typography.bodyMedium,color:colors.text,borderBottomWidth:1,borderBottomColor:colors.border,paddingVertical:4}} /></View><View style={{ flex: 1 }}><Text style={{ ...typography.caption, color: colors.secondary }}>Quantity removed</Text><TextInput value={quantityInput} onChangeText={setQuantityInput} editable={removesStock} keyboardType="decimal-pad" style={{...typography.bodyMedium,color:colors.text,borderBottomWidth:1,borderBottomColor:colors.border,paddingVertical:4,opacity:removesStock?1:0.5}} /></View><View style={{ flex: 1 }}><Text style={{ ...typography.caption, color: colors.secondary }}>Estimated after</Text><Text style={{ ...typography.bodyMedium, color: colors.text,marginTop:5 }}>{estimatedAfter ?? "—"}</Text></View></View>
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
                  "DESTROYED",
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
          {topical && (outcome === "GIVEN" || outcome === "PRN_GIVEN") ? <View style={{marginTop:14}}><Text style={{...typography.heading,color:colors.text}}>Where was it applied?</Text><Text style={{...typography.caption,color:colors.secondary,marginTop:3}}>Tap the front or back body guide to record the application site.</Text><View style={{flexDirection:'row',gap:8,marginTop:10}}>{(['FRONT','BACK'] as const).map(view=><Pressable key={view} onPress={()=>setBodyView(view)} style={{paddingHorizontal:14,paddingVertical:8,borderRadius:radius.full,backgroundColor:bodyView===view?colors.primary:colors.surfaceElevated}}><Text style={{...typography.label,color:bodyView===view?'#FFF':colors.secondary}}>{view==='FRONT'?'Front':'Back'}</Text></Pressable>)}</View><BodyMap view={bodyView} marks={applicationMark?[applicationMark]:[]} onAddMark={(x,y)=>setApplicationMark({view:bodyView,x,y,type:'TOPICAL_APPLICATION'})} onRemoveMark={()=>setApplicationMark(null)} width={170}/></View>:null}
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
          <View style={{marginTop:18}}><Text style={{...typography.heading,color:colors.text}}>Previous records</Text><Text style={{...typography.caption,color:colors.secondary,marginTop:3}}>Read-only history for this medicine to help check the last count and administration.</Text>{previousRecords.length?previousRecords.map(item=><View key={item._id} style={{marginTop:8,padding:10,borderWidth:1,borderColor:colors.border,borderRadius:radius.md}}><Text style={{...typography.bodyMedium,color:colors.text}}>{item.outcome.replaceAll('_',' ')}</Text><Text style={{...typography.caption,color:colors.secondary,marginTop:2}}>{new Date(item.administeredAt??item.recordedAt).toLocaleString()} · {item.recordedByName??'Staff member'}</Text><Text style={{...typography.caption,color:colors.secondary}}>Stock {item.stockBefore??'—'} → {item.stockAfter??'—'}{item.voided?' · VOIDED':''}</Text></View>):<Text style={{...typography.caption,color:colors.secondary,marginTop:8}}>No previous administrations recorded for this medicine.</Text>}</View>
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
                !administeredAt() ||
                stockBeforeNumber === undefined || Number.isNaN(stockBeforeNumber) ||
                Number.isNaN(quantityUsed) || quantityUsed < 0 || (estimatedAfter !== undefined && estimatedAfter < 0) ||
                (topical && (outcome === "GIVEN" || outcome === "PRN_GIVEN") && !applicationMark) ||
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
        </ScrollView>
      </View>
    </Modal>
  );
}

function MedicationCalendar({ value, close, select }: { value: string; close: () => void; select: (date: string) => void }) {
  const colors = useThemeColors();
  const [month, setMonth] = useState(() => { const date = parseDateKey(value); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const firstOffset = (month.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstOffset + totalDays) / 7) * 7 }, (_, index) => index - firstOffset + 1);
  const moveMonth = (change: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + change, 1));
  return <Modal transparent animationType="fade" onRequestClose={close}><View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 22, backgroundColor: "rgba(15,23,42,.45)" }}><View style={{ width: "100%", maxWidth: 390, backgroundColor: colors.background, padding: 18, borderRadius: 22 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Pressable onPress={() => moveMonth(-1)} style={{ padding: 10 }}><ChevronLeft size={20} color={colors.text}/></Pressable><Text style={{ ...typography.heading, color: colors.text }}>{month.toLocaleDateString([], { month: "long", year: "numeric" })}</Text><Pressable onPress={() => moveMonth(1)} style={{ padding: 10 }}><ChevronRight size={20} color={colors.text}/></Pressable></View>
    <View style={{ flexDirection: "row", marginTop: 10 }}>{["M","T","W","T","F","S","S"].map((day,index) => <Text key={`${day}-${index}`} style={{ width: "14.285%", textAlign: "center", ...typography.label, color: colors.secondary }}>{day}</Text>)}</View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>{cells.map((day,index) => { if (day < 1 || day > totalDays) return <View key={`empty-${index}`} style={{ width: "14.285%", height: 44 }}/>; const date = new Date(month.getFullYear(), month.getMonth(), day); const key = dateKey(date); const selected = key === value; const today = key === dateKey(); return <Pressable key={key} onPress={() => select(key)} style={{ width: "14.285%", height: 44, alignItems: "center", justifyContent: "center" }}><View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: selected ? colors.primary : "transparent", borderWidth: today && !selected ? 1 : 0, borderColor: colors.primary }}><Text style={{ ...typography.body, color: selected ? "#FFF" : colors.text }}>{day}</Text></View></Pressable>; })}</View>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}><Pressable onPress={close} style={{ padding: 10 }}><Text style={{ ...typography.label, color: colors.secondary }}>Cancel</Text></Pressable><Pressable onPress={() => select(dateKey())} style={{ padding: 10 }}><Text style={{ ...typography.label, color: colors.primary }}>Today</Text></Pressable></View>
  </View></View></Modal>;
}
