import { Linking, Pressable, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, Stethoscope } from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { getOperationalRecords } from "@/src/services/operational-records.api";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
export default function RecordsScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const q = useQuery({
    queryKey: ["carehome", "operational-records", id],
    queryFn: () => getOperationalRecords(id),
    enabled: !!id,
  });
  return (
    <>
      <Stack.Screen options={{ title: "Documents and visits" }} />
      <ScreenContainer>
        <Text style={{ ...typography.title, color: colors.text }}>
          Documents, visits and journey
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: colors.secondary,
            marginTop: 4,
            marginBottom: 14,
          }}
        >
          Current appointments, professional contact and admission or transfer
          history.
        </Text>
        {q.isLoading ? (
          <SkeletonCard lines={6} />
        ) : (
          q.data?.map((r) => {
            const Icon =
              r.kind === "DOCUMENT"
                ? FileText
                : r.kind.includes("VISIT") || r.kind === "APPOINTMENT"
                  ? Stethoscope
                  : CalendarDays;
            return (
              <Card key={r._id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Icon size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ ...typography.label, color: colors.primary }}
                    >
                      {r.kind.replaceAll("_", " ")}
                    </Text>
                    <Text
                      style={{
                        ...typography.heading,
                        color: colors.text,
                        marginTop: 3,
                      }}
                    >
                      {r.title}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: colors.secondary,
                        marginTop: 4,
                      }}
                    >
                      {new Date(r.occurredAt).toLocaleString("en-GB")}
                    </Text>
                    {r.summary ? (
                      <Text
                        style={{
                          ...typography.body,
                          color: colors.text,
                          marginTop: 8,
                        }}
                      >
                        {r.summary}
                      </Text>
                    ) : null}
                    {r.storageUrl ? (
                      <Pressable
                        onPress={() => void Linking.openURL(r.storageUrl!)}
                      >
                        <Text
                          style={{
                            ...typography.bodyMedium,
                            color: colors.primary,
                            marginTop: 9,
                          }}
                        >
                          Open document
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScreenContainer>
    </>
  );
}
