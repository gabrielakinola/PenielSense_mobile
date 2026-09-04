import { Platform, KeyboardAvoidingView } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { CareNotesHistory } from "@/src/components/residents/CareNotesHistory";
import { ResidentWorkspaceHeader } from "@/src/components/residents/ResidentWorkspaceHeader";
import { getCareHomeResidentById } from "@/src/services/residents.api";

export default function ResidentNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const residentId = id ?? "";
  const resident = useQuery({
    queryKey: ["carehome", "resident", residentId],
    queryFn: () => getCareHomeResidentById(residentId),
    enabled: !!residentId,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Care notes" }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenContainer keyboardShouldPersistTaps="handled">
          {resident.data ? (
            <ResidentWorkspaceHeader resident={resident.data} active="notes" />
          ) : null}
          {residentId ? <CareNotesHistory residentId={residentId} /> : null}
        </ScreenContainer>
      </KeyboardAvoidingView>
    </>
  );
}
