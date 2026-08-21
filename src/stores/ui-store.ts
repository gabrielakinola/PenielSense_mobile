import { create } from 'zustand';
import type { ResidentIntelligenceFilter } from '@/src/types/carehome.types';

type IntelligenceFilter = 'all' | ResidentIntelligenceFilter;

interface UiStore {
  filterSheetOpen: boolean;
  residentIntelligenceFilter: IntelligenceFilter;
  setFilterSheetOpen: (open: boolean) => void;
  setResidentIntelligenceFilter: (filter: IntelligenceFilter) => void;
  resetResidentFilters: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  filterSheetOpen: false,
  residentIntelligenceFilter: 'all',
  setFilterSheetOpen: (open) => set({ filterSheetOpen: open }),
  setResidentIntelligenceFilter: (filter) =>
    set({ residentIntelligenceFilter: filter }),
  resetResidentFilters: () => set({ residentIntelligenceFilter: 'all' }),
}));
