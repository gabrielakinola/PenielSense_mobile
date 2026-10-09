import { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';
import { isCareHomeManagerRole } from '@/src/lib/care-home-home';
import { hasProduct, productLandingTab } from '@/src/lib/product-access';

export default function ResidentLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const careHome = useAuthStore((state) => state.careHome);
  const role = useAuthStore((state) => state.user?.role);
  const page = pathname.split('/').filter(Boolean).pop();
  const allowed =
    page === 'medication'
      ? hasProduct(careHome, 'PENIEL_EMAR')
      : page === 'report'
        ? hasProduct(careHome, 'PENIELSENSE')
        : page && !/^\w{24}$/.test(page)
          ? hasProduct(careHome, 'PENIEL_CARE')
          : hasProduct(careHome, 'PENIEL_CARE') ||
            hasProduct(careHome, 'PENIELSENSE');

  useEffect(() => {
    if (!allowed) {
      router.replace(
        productLandingTab(careHome, isCareHomeManagerRole(role)),
      );
    }
  }, [allowed, careHome, role, router]);

  if (!allowed) return null;

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Resident' }} />
      <Stack.Screen name="notes" options={{ title: 'Care notes' }} />
      <Stack.Screen name="record-note" options={{ title: 'Record care note' }} />
      <Stack.Screen name="create-task" options={{ title: 'Create task' }} />
      <Stack.Screen name="care-plan" options={{ title: 'Care plan' }} />
      <Stack.Screen name="about" options={{ title: 'About resident' }} />
      <Stack.Screen name="incident" options={{ title: 'Report concern' }} />
      <Stack.Screen name="report" options={{ title: 'Evidence report' }} />
      <Stack.Screen name="assessments" options={{ title: 'Assessments' }} />
      <Stack.Screen name="record" options={{ title: 'Profile and legal record' }} />
      <Stack.Screen name="medication" options={{ title: 'Medication and MAR' }} />
      <Stack.Screen name="records" options={{ title: 'Documents and visits' }} />
      <Stack.Screen name="charts" options={{ title: 'Care charts' }} />
      <Stack.Screen name="body-map" options={{ title: 'Body map' }} />
    </Stack>
  );
}
