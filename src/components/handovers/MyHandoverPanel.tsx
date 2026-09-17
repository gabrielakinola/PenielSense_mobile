import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Modal, Pressable, Share, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, QrCode, Share2, X } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { AnimatedButton } from "@/src/components/ui/AnimatedButton";
import {
  getMyHandover,
  saveMyHandoverDraft,
  submitMyHandover,
} from "@/src/services/handover.api";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";

const key = ["carehome", "handovers", "mine", "active"] as const;

function when(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MyHandoverPanel() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [hasEdited, setHasEdited] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const query = useQuery({ queryKey: key, queryFn: getMyHandover });
  const handover = query.data;
  const localDraftKey = handover
    ? `peniel.personal-handover:${handover.userId}:${handover.dateKey}:${handover.shiftWindow}`
    : null;

  useEffect(() => {
    if (!hasEdited && handover) setNote(handover.additionalNote);
  }, [handover, hasEdited]);

  useEffect(() => {
    if (!localDraftKey || !handover || handover.status === "SUBMITTED") return;
    let active = true;
    void AsyncStorage.getItem(localDraftKey).then((stored) => {
      if (!active || stored === null || hasEdited) return;
      setNote(stored);
      setHasEdited(true);
    });
    return () => {
      active = false;
    };
  }, [handover, hasEdited, localDraftKey]);

  const save = useMutation({
    mutationFn: saveMyHandoverDraft,
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      if (localDraftKey) void AsyncStorage.removeItem(localDraftKey);
    },
  });
  const submit = useMutation({
    mutationFn: submitMyHandover,
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      if (localDraftKey) void AsyncStorage.removeItem(localDraftKey);
      Alert.alert(
        "Handover submitted",
        "Your shift record is saved for the next team.",
      );
    },
    onError: (error) =>
      Alert.alert(
        "Not submitted yet",
        `${normalizeApiError(error)} Your note remains saved on this device. Connect and submit again before ending the shift.`,
      ),
  });

  useEffect(() => {
    if (!hasEdited || handover?.status === "SUBMITTED") return;
    const timer = setTimeout(() => save.mutate(note), 900);
    return () => clearTimeout(timer);
  }, [hasEdited, handover?.status, note]);

  if (query.isLoading) return <SkeletonCard lines={5} />;
  if (query.isError) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Couldn’t prepare your handover"
        description={normalizeApiError(query.error)}
        actionLabel="Retry"
        onAction={() => void query.refetch()}
      />
    );
  }
  if (!handover) return null;

  const itemCount = handover.residents.reduce(
    (total, resident) => total + resident.items.length,
    0,
  );
  const submitted = handover.status === "SUBMITTED";
  const shareText = [
    `${handover.staffName} — ${handover.shiftWindow} handover (${handover.dateKey})`,
    ...handover.residents.flatMap((resident) => [
      "",
      `${resident.residentName}${resident.room ? ` · Room ${resident.room}` : ""}`,
      ...resident.items.map((item) => `${when(item.at)} — ${item.summary}${item.handoverRequired ? " [For next shift]" : ""}`),
    ]),
    ...(handover.additionalNote ? ["", `For the next shift: ${handover.additionalNote}`] : []),
  ].join("\n");
  const whatsAppQr = `https://wa.me/?text=${encodeURIComponent(shareText.slice(0, 1800))}`;

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {submitted ? (
            <CheckCircle2 size={22} color={colors.status.good} />
          ) : (
            <ClipboardCheck size={22} color={colors.primary} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>
              {submitted
                ? "Your handover is submitted"
                : `${handover.staffName}’s handover`}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: colors.secondary,
                marginTop: 2,
              }}
            >
              {itemCount} recorded outcome{itemCount === 1 ? "" : "s"} this
              shift
            </Text>
          </View>
        </View>
      </Card>

      {handover.residents.length ? (
        handover.residents.map((resident) => (
          <Card key={resident.residentId}>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>
              {resident.residentName}
              {resident.room ? ` · Room ${resident.room}` : ""}
            </Text>
            {resident.items.map((item) => (
              <View
                key={item.id}
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 10,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.primary,
                    fontWeight: "700",
                  }}
                >
                  {item.category.replaceAll("_", " ")} · {when(item.at)}
                </Text>
                <Text
                  style={{
                    ...typography.body,
                    color: colors.text,
                    marginTop: 4,
                  }}
                >
                  {item.summary}
                </Text>
                {item.outcome && item.outcome !== item.summary ? (
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.secondary,
                      marginTop: 4,
                    }}
                  >
                    Outcome: {item.outcome}
                  </Text>
                ) : null}
                {item.handoverRequired ? (
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.status.watch,
                      marginTop: 5,
                    }}
                  >
                    Carry forward to next shift
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>
        ))
      ) : (
        <EmptyState
          icon={ClipboardCheck}
          title="No work recorded on this account"
          description="Care notes and task outcomes you record during this shift will appear here automatically."
        />
      )}

      <Card>
        <Text style={{ ...typography.bodyMedium, color: colors.text }}>
          Anything else for the next shift?
        </Text>
        <TextInput
          value={note}
          onChangeText={(value) => {
            setNote(value);
            setHasEdited(true);
            if (localDraftKey) void AsyncStorage.setItem(localDraftKey, value);
          }}
          editable={!submitted}
          multiline
          placeholder="Optional context, unfinished work or something the next team should know."
          placeholderTextColor={colors.secondary}
          style={{
            minHeight: 100,
            marginTop: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            color: colors.text,
            textAlignVertical: "top",
          }}
        />
        {!submitted ? (
          <>
            <Text
              style={{
                ...typography.label,
                color: save.isError ? colors.status.critical : colors.secondary,
                marginTop: 7,
              }}
            >
              {save.isPending
                ? "Saving draft…"
                : save.isError
                  ? "Draft not saved — check connection"
                  : "Draft saves automatically"}
            </Text>
            <View style={{ marginTop: 12 }}>
              <AnimatedButton
                label={submit.isPending ? "Submitting…" : "Submit my handover"}
                onPress={() => submit.mutate(note)}
                disabled={submit.isPending || save.isPending}
                size="md"
              />
            </View>
          </>
        ) : (
          <View style={{ marginTop: 14, gap: 9 }}>
            <Text style={{ ...typography.caption, color: colors.secondary }}>Send this approved copy to the dedicated WhatsApp phone.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Pressable onPress={()=>void Share.share({message:shareText})} style={{ flexDirection:"row",alignItems:"center",gap:6,padding:11,borderRadius:radius.md,backgroundColor:colors.surfaceElevated }}><Share2 size={17} color={colors.primary}/><Text style={{...typography.label,color:colors.primary}}>Share</Text></Pressable>
              <Pressable onPress={()=>setShowQr(true)} style={{ flexDirection:"row",alignItems:"center",gap:6,padding:11,borderRadius:radius.md,backgroundColor:colors.primary }}><QrCode size={17} color="#fff"/><Text style={{...typography.label,color:'#fff'}}>Scan to WhatsApp</Text></Pressable>
            </View>
          </View>
        )}
      </Card>
      <Modal visible={showQr} transparent animationType="fade" onRequestClose={()=>setShowQr(false)}><View style={{flex:1,backgroundColor:'rgba(0,0,0,.65)',alignItems:'center',justifyContent:'center',padding:24}}><View style={{width:'100%',maxWidth:360,backgroundColor:'#fff',borderRadius:20,padding:22,alignItems:'center'}}><Pressable onPress={()=>setShowQr(false)} style={{alignSelf:'flex-end'}}><X size={22} color="#334155"/></Pressable><Text style={{...typography.heading,color:'#0f172a',textAlign:'center'}}>Scan with the WhatsApp phone</Text><Text style={{...typography.caption,color:'#64748b',textAlign:'center',marginTop:6,marginBottom:18}}>This opens WhatsApp with the handover ready to send. Check the destination group before sending.</Text><QRCode value={whatsAppQr} size={250}/>{shareText.length>1800?<Text style={{...typography.caption,color:'#b45309',textAlign:'center',marginTop:14}}>This handover is long. The QR contains a shortened copy; use Copy or Share for the complete version.</Text>:null}</View></View></Modal>
    </View>
  );
}
