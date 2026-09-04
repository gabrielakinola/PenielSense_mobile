import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BookHeart,
  FileHeart,
  Home,
  ListTodo,
  NotebookPen,
} from "lucide-react-native";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import type { ApiResidentDto } from "@/src/types/carehome.types";
import { useAuthStore } from "@/src/stores/auth-store";
import { isCareHomeManagerRole } from "@/src/lib/care-home-home";

type Section = "overview" | "notes" | "tasks" | "care-plan" | "wellbeing";

export function ResidentWorkspaceHeader({
  resident,
  active,
}: {
  resident: ApiResidentDto;
  active: Section;
}) {
  const colors = useThemeColors();
  const router = useRouter();
  const isManager = isCareHomeManagerRole(
    useAuthStore((state) => state.user?.role),
  );
  const initials = resident.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const status =
    resident.wellnessStatus === "critical"
      ? {
          label: "Needs a check",
          color: colors.status.critical,
          background: colors.statusBg.critical,
        }
      : resident.wellnessStatus === "watch"
        ? {
            label: "Keep an eye on",
            color: colors.status.watch,
            background: colors.statusBg.watch,
          }
        : {
            label: "Stable",
            color: colors.status.good,
            background: colors.statusBg.good,
          };
  const links = [
    ["overview", "Overview", Home, `/residents/${resident.id}`],
    ["notes", "Care notes", NotebookPen, `/residents/${resident.id}/notes`],
    [
      "tasks",
      "Tasks",
      ListTodo,
      isManager ? `/residents/${resident.id}/create-task` : "/(tabs)/tasks",
    ],
    [
      "care-plan",
      "Care plan",
      BookHeart,
      `/residents/${resident.id}/care-plan`,
    ],
    ["wellbeing", "Wellbeing", FileHeart, `/residents/${resident.id}/report`],
  ] as const;

  return (
    <View
      style={{
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
          }}
        >
          <Text
            style={{
              ...typography.bodyMedium,
              color: "#FFFFFF",
              fontWeight: "800",
            }}
          >
            {initials || "R"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 7,
            }}
          >
            <Text
              numberOfLines={1}
              style={{ ...typography.heading, color: colors.text }}
            >
              {resident.fullName}
            </Text>
            <View
              style={{
                borderRadius: radius.full,
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: status.background,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: status.color,
                  fontWeight: "700",
                }}
              >
                {status.label}
              </Text>
            </View>
          </View>
          <Text
            style={{
              ...typography.caption,
              color: colors.secondary,
              marginTop: 3,
            }}
          >
            {resident.room}
            {resident.wing ? ` · ${resident.wing}` : ""}
            {resident.age ? ` · ${resident.age} years` : ""}
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {links.map(([key, label, Icon, route]) => {
          const selected = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => router.push(route as never)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={{
                minHeight: 46,
                paddingHorizontal: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderBottomWidth: 2,
                borderBottomColor: selected ? colors.primary : "transparent",
              }}
            >
              <Icon
                size={16}
                color={selected ? colors.primary : colors.secondary}
              />
              <Text
                style={{
                  ...typography.label,
                  color: selected ? colors.primary : colors.secondary,
                  fontWeight: selected ? "700" : "600",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
