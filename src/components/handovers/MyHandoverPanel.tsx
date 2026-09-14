import { useEffect, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck } from "lucide-react-native";
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
  const query = useQuery({ queryKey: key, queryFn: getMyHandover });
  const handover = query.data;

  useEffect(() => {
    if (!hasEdited && handover) setNote(handover.additionalNote);
  }, [handover, hasEdited]);

  const save = useMutation({
    mutationFn: saveMyHandoverDraft,
    onSuccess: (data) => queryClient.setQueryData(key, data),
  });
  const submit = useMutation({
    mutationFn: submitMyHandover,
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      Alert.alert(
        "Handover submitted",
        "Your shift record is saved for the next team.",
      );
    },
    onError: (error) =>
      Alert.alert("Could not submit", normalizeApiError(error)),
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
        ) : null}
      </Card>
    </View>
  );
}
