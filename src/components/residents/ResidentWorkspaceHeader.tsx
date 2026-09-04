import { Text, View } from "react-native";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";
import { radius } from "@/src/theme/radius";
import type { ApiResidentDto } from "@/src/types/carehome.types";

type Section = "overview" | "notes" | "tasks" | "care-plan" | "wellbeing";

export function ResidentWorkspaceHeader({
  resident,
}: {
  resident: ApiResidentDto;
  active?: Section;
}) {
  const colors = useThemeColors();
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
    </View>
  );
}
