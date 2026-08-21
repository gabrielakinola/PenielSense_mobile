import { Text, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import type { Vital } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useIsDarkMode } from '@/src/hooks/use-theme-colors';
import { Card } from '@/src/components/ui/Card';
import { typography } from '@/src/theme/typography';

interface VitalChartProps {
  vital: Vital;
  title?: string;
}

export function VitalChart({ vital, title }: VitalChartProps) {
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;

  const data = vital.history.slice(-12).map((point, index) => ({
    value: point.value,
    label: index % 3 === 0 ? `${index + 1}h` : '',
  }));

  const lineColor =
    vital.status === 'critical'
      ? colors.status.critical
      : vital.status === 'watch'
        ? colors.status.watch
        : colors.primary;

  return (
    <Card>
      <Text style={{ ...typography.heading, color: colors.text, marginBottom: 4 }}>
        {title ?? vital.label}
      </Text>
      <Text style={{ ...typography.caption, color: colors.secondary, marginBottom: 16 }}>
        Last 12 hours · {vital.current} {vital.unit} current
      </Text>
      <View accessibilityLabel={`${vital.label} chart`}>
        <LineChart
          data={data}
          width={chartWidth}
          height={160}
          color={lineColor}
          thickness={2}
          hideDataPoints
          curved
          areaChart
          startFillColor={lineColor}
          endFillColor={lineColor}
          startOpacity={0.2}
          endOpacity={0.02}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.secondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.secondary, fontSize: 10 }}
          rulesColor={colors.border}
          backgroundColor={isDark ? colors.surfaceElevated : colors.surface}
          noOfSections={4}
          spacing={(chartWidth - 40) / Math.max(data.length - 1, 1)}
        />
      </View>
    </Card>
  );
}
