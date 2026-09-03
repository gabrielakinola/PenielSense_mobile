import { useEffect } from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import type { ComponentProps } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, Users, Flag, ClipboardList, User, ListChecks } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useHaptics } from '@/src/hooks/use-haptics';
import { typography } from '@/src/theme/typography';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';
import { useAuthStore, useAuthHydrated } from '@/src/stores/auth-store';
import {
  CARER_TAB_ORDER,
  MANAGER_TAB_ORDER,
  isCareHomeManagerRole,
} from '@/src/lib/care-home-home';

const TAB_CONFIG = [
  { name: 'index', title: 'Today', icon: Home },
  { name: 'residents', title: 'Residents', icon: Users },
  { name: 'tasks', title: 'Tasks', icon: ListChecks },
  { name: 'flags', title: 'Alerts', icon: Flag },
  { name: 'handovers', title: 'Handover', icon: ClipboardList },
  { name: 'profile', title: 'Profile', icon: User },
] as const;

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabBarItem({
  label,
  icon: Icon,
  focused,
  onPress,
  onLongPress,
  colors,
}: {
  label: string;
  icon: typeof Home;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = focused ? colors.primary : colors.secondary;

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      style={[
        animatedStyle,
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: MIN_TOUCH_TARGET,
          paddingVertical: 6,
        },
      ]}
    >
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
      <Text
        style={{
          ...typography.label,
          color,
          marginTop: 4,
          fontWeight: focused ? '600' : '500',
        }}
      >
        {label}
      </Text>
      {focused ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            width: 24,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.primary,
          }}
        />
      ) : null}
    </AnimatedPressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { selection } = useHaptics();
  const role = useAuthStore((s) => s.user?.role);
  const order = isCareHomeManagerRole(role) ? MANAGER_TAB_ORDER : CARER_TAB_ORDER;
  const allowed = new Set<string>(order);
  const routes = [...state.routes]
    .filter((route) => allowed.has(route.name))
    .sort(
      (a, b) =>
        (order as readonly string[]).indexOf(a.name) -
        (order as readonly string[]).indexOf(b.name),
    );

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceElevated,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
        paddingTop: 8,
      }}
    >
      {routes.map((route) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        if (!config) return null;

        const focused = state.routes[state.index]?.key === route.key;
        const { options } = descriptors[route.key];

        const onPress = () => {
          selection();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabBarItem
            key={route.key}
            label={options.title ?? config.title}
            icon={config.icon}
            focused={focused}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const isManager = isCareHomeManagerRole(role);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      initialRouteName={isManager ? 'index' : 'residents'}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        // Ticketmaster pattern: no native header — screens own a compact header.
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          href: isManager ? undefined : null,
        }}
      />
      <Tabs.Screen name="residents" options={{ title: 'Residents' }} />
      <Tabs.Screen
        name="tasks"
        options={{ title: 'Tasks', href: isManager ? null : undefined }}
      />
      <Tabs.Screen name="flags" options={{ title: isManager ? 'Review' : 'Alerts' }} />
      <Tabs.Screen name="handovers" options={{ title: 'Handovers' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
