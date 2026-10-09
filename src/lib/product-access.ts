import type { CareHomeSummaryDto } from '@/src/types/auth.types';

export type PenielProduct = 'PENIEL_CARE' | 'PENIELSENSE' | 'PENIEL_EMAR';
export type ProductTab =
  | 'index'
  | 'residents'
  | 'tasks'
  | 'medications'
  | 'flags'
  | 'handovers'
  | 'profile';

function normalize(products?: CareHomeSummaryDto['enabledProducts']): PenielProduct[] {
  return [
    ...new Set(
      (products ?? []).map((product) =>
        product === 'EMAR' ? 'PENIEL_EMAR' : product,
      ),
    ),
  ];
}

export function activeProducts(careHome?: CareHomeSummaryDto | null): PenielProduct[] {
  const enabled =
    careHome?.enabledProducts === undefined
      ? (['PENIEL_CARE'] as PenielProduct[])
      : normalize(careHome.enabledProducts);
  const suspended = new Set(normalize(careHome?.suspendedProducts));
  return enabled.filter((product) => !suspended.has(product));
}

export function hasProduct(
  careHome: CareHomeSummaryDto | null | undefined,
  product: PenielProduct,
): boolean {
  return activeProducts(careHome).includes(product);
}

export function availableProductTabs(
  careHome: CareHomeSummaryDto | null | undefined,
  manager: boolean,
): Set<ProductTab> {
  const products = activeProducts(careHome);
  const tabs = new Set<ProductTab>(['profile']);

  if (products.includes('PENIEL_CARE')) {
    tabs.add('residents');
    tabs.add('tasks');
    tabs.add('handovers');
  }
  if (products.includes('PENIELSENSE')) {
    tabs.add('residents');
    tabs.add('flags');
    if (manager) tabs.add('index');
  }
  if (products.includes('PENIEL_EMAR')) {
    tabs.add('medications');
  }

  return tabs;
}

export function productLandingTab(
  careHome: CareHomeSummaryDto | null | undefined,
  manager: boolean,
): '/(tabs)' | '/(tabs)/residents' | '/(tabs)/medications' | '/(tabs)/profile' {
  const tabs = availableProductTabs(careHome, manager);
  if (tabs.has('index')) return '/(tabs)';
  if (tabs.has('residents')) return '/(tabs)/residents';
  if (tabs.has('medications')) return '/(tabs)/medications';
  return '/(tabs)/profile';
}

