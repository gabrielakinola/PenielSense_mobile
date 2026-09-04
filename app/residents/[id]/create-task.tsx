import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check } from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { createCareTask } from "@/src/services/care-tasks.api";
import { normalizeApiError } from "@/src/lib/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import { getCareHomeResidentById } from "@/src/services/residents.api";
import { ResidentWorkspaceHeader } from "@/src/components/residents/ResidentWorkspaceHeader";

const categories = [
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
const priorities = ["ROUTINE", "IMPORTANT", "URGENT"] as const;
const dueOptions = [
  { label: "In 1 hour", hours: 1 },
  { label: "In 4 hours", hours: 4 },
  { label: "End of shift", hours: 8 },
  { label: "Tomorrow", hours: 24 },
];

export default function CreateTaskScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const resident = useQuery({
    queryKey: ["carehome", "resident", id],
    queryFn: () => getCareHomeResidentById(id),
    enabled: !!id,
  });
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("PERSONAL_CARE");
  const [priority, setPriority] =
    useState<(typeof priorities)[number]>("ROUTINE");
  const [dueHours, setDueHours] = useState(4);
  const mutation = useMutation({
    mutationFn: () =>
      createCareTask({
        residentId: id,
        title: title.trim(),
        instructions: instructions.trim(),
        category,
        priority,
        dueAt: new Date(Date.now() + dueHours * 3600000).toISOString(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["carehome", "care-tasks"],
      });
      Alert.alert("Task created", "The task is now visible to the care team.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    },
    onError: (error) =>
      Alert.alert("Could not create task", normalizeApiError(error)),
  });
  const input = {
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 6,
  };
  const valid =
    title.trim().length > 0 &&
    instructions.trim().length > 0 &&
    !mutation.isPending;
  const chip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={{
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? `${colors.primary}16` : "transparent",
      }}
    >
      <Text
        style={{
          ...typography.caption,
          fontWeight: "600",
          color: selected ? colors.primary : colors.secondary,
        }}
      >
        {label.replaceAll("_", " ")}
      </Text>
    </Pressable>
  );
  return (
    <>
      <Stack.Screen options={{ title: "Create task" }} />
      <ScreenContainer keyboardShouldPersistTaps="handled">
        {resident.data ? (
          <ResidentWorkspaceHeader resident={resident.data} active="tasks" />
        ) : null}
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <CalendarClock size={22} color={colors.primary} />
            <View>
              <Text style={{ ...typography.heading, color: colors.text }}>
                New care task
              </Text>
              <Text style={{ ...typography.caption, color: colors.secondary }}>
                Assign a clear action and due time.
              </Text>
            </View>
          </View>
          <Text style={{ ...typography.label, color: colors.secondary }}>
            Task title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Support with afternoon walk"
            placeholderTextColor={colors.secondary}
            style={input}
          />
          <Text
            style={{
              ...typography.label,
              color: colors.secondary,
              marginTop: 14,
            }}
          >
            Instructions
          </Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            multiline
            placeholder="What should the carer do or observe?"
            placeholderTextColor={colors.secondary}
            style={{ ...input, minHeight: 92, textAlignVertical: "top" }}
          />
          <Text
            style={{
              ...typography.label,
              color: colors.secondary,
              marginTop: 14,
            }}
          >
            Care area
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 7,
              marginTop: 8,
            }}
          >
            {categories.map((item) =>
              chip(item, category === item, () => setCategory(item)),
            )}
          </View>
          <Text
            style={{
              ...typography.label,
              color: colors.secondary,
              marginTop: 14,
            }}
          >
            Priority
          </Text>
          <View style={{ flexDirection: "row", gap: 7, marginTop: 8 }}>
            {priorities.map((item) =>
              chip(item, priority === item, () => setPriority(item)),
            )}
          </View>
          <Text
            style={{
              ...typography.label,
              color: colors.secondary,
              marginTop: 14,
            }}
          >
            Due
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 7,
              marginTop: 8,
            }}
          >
            {dueOptions.map((item) =>
              chip(item.label, dueHours === item.hours, () =>
                setDueHours(item.hours),
              ),
            )}
          </View>
          <Pressable
            disabled={!valid}
            onPress={() => mutation.mutate()}
            style={{
              minHeight: 50,
              borderRadius: radius.button,
              backgroundColor: colors.primary,
              opacity: valid ? 1 : 0.45,
              marginTop: 20,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 7,
            }}
          >
            <Check size={18} color="#FFFFFF" />
            <Text style={{ ...typography.bodyMedium, color: "#FFFFFF" }}>
              {mutation.isPending ? "Creating…" : "Create task"}
            </Text>
          </Pressable>
        </Card>
      </ScreenContainer>
    </>
  );
}
