import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';

export interface BodyMapMarkValue {
  view: 'FRONT' | 'BACK';
  x: number;
  y: number;
  type: string;
}

const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 400;

interface BodyMapProps {
  view: 'FRONT' | 'BACK';
  marks: BodyMapMarkValue[];
  /** Called with percentage coordinates (0-100) when the figure is tapped. */
  onAddMark?: (x: number, y: number) => void;
  /** Called with the mark index (within the full marks array) when a mark is tapped. */
  onRemoveMark?: (index: number) => void;
  width?: number;
}

/** Stylised body outline shared by both views. */
function Figure({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <>
      {/* head */}
      <Ellipse cx={100} cy={40} rx={20} ry={23} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* neck */}
      <Rect x={86} y={60} width={28} height={16} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* torso */}
      <Rect x={64} y={74} width={72} height={140} rx={26} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* arms */}
      <Rect x={36} y={76} width={20} height={126} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <Rect x={144} y={76} width={20} height={126} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* hands */}
      <Circle cx={46} cy={210} r={11} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <Circle cx={154} cy={210} r={11} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* hips */}
      <Rect x={64} y={212} width={72} height={32} rx={15} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* legs */}
      <Rect x={70} y={240} width={26} height={140} rx={12} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <Rect x={104} y={240} width={26} height={140} rx={12} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* feet */}
      <Ellipse cx={83} cy={388} rx={15} ry={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <Ellipse cx={117} cy={388} rx={15} ry={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
    </>
  );
}

/**
 * Tappable body map used for injury location recording.
 * Coordinates are stored as percentages of the figure so they render
 * consistently on web and mobile.
 */
export function BodyMap({ view, marks, onAddMark, onRemoveMark, width = 210 }: BodyMapProps) {
  const colors = useThemeColors();
  const [layout, setLayout] = useState({ width, height: width * 2 });
  const height = (width / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    if (w > 0 && h > 0) setLayout({ width: w, height: h });
  };

  const visibleMarks = marks
    .map((mark, index) => ({ mark, index }))
    .filter(({ mark }) => mark.view === view);

  return (
    <Pressable
      accessibilityLabel={`Body map, ${view === 'FRONT' ? 'front' : 'back'} view. ${visibleMarks.length} marks.`}
      onLayout={handleLayout}
      onPress={(event) => {
        if (!onAddMark) return;
        const { locationX, locationY } = event.nativeEvent;
        const x = Math.min(100, Math.max(0, Math.round((locationX / layout.width) * 100)));
        const y = Math.min(100, Math.max(0, Math.round((locationY / layout.height) * 100)));
        onAddMark(x, y);
      }}
      style={{
        width,
        height,
        alignSelf: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
          <Figure fill={colors.surfaceElevated} stroke={colors.secondary} />
        </Svg>
      </View>
      {visibleMarks.map(({ mark, index }, order) => (
        <Pressable
          key={`${mark.x}-${mark.y}-${index}`}
          accessibilityLabel={`Mark ${order + 1}. ${onRemoveMark ? 'Tap to remove.' : ''}`}
          disabled={!onRemoveMark}
          onPress={(event) => {
            event.stopPropagation();
            onRemoveMark?.(index);
          }}
          style={{
            position: 'absolute',
            left: `${mark.x}%`,
            top: `${mark.y}%`,
            width: 22,
            height: 22,
            borderRadius: 11,
            marginLeft: -11,
            marginTop: -11,
            backgroundColor: colors.status.critical,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...typography.label, color: '#FFFFFF', fontSize: 11 }}>{order + 1}</Text>
        </Pressable>
      ))}
    </Pressable>
  );
}
