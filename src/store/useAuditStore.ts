import { create } from 'zustand';
import {
  CallRecord,
  RiskClue,
  Unit,
  Personnel,
  Matter,
  EvidenceChain,
  ComplaintRecord,
  UnitComplianceMetrics,
  DailyStats,
  CaseStatus,
  AccountabilityStatus,
  RiskLevel
} from '../types';
import { mockData } from '../data/mockData';

interface FilterState {
  unitIds: string[];
  matterIds: string[];
  personnelIds: string[];
  certTypes: string[];
  dateRange: [string, string] | null;
  riskLevels: RiskLevel[];
  riskTags: string[];
  hasApproval: boolean | null;
  hasResult: boolean | null;
  isComplained: boolean | null;
  operationTypes: string[];
}

interface AuditStore {
  callRecords: CallRecord[];
  riskClues: RiskClue[];
  units: Unit[];
  personnel: Personnel[];
  matters: Matter[];
  evidenceChains: EvidenceChain[];
  complaintRecords: ComplaintRecord[];
  unitComplianceMetrics: UnitComplianceMetrics[];
  dailyStats: DailyStats[];
  certTypes: string[];

  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  filteredCallRecords: CallRecord[];

  updateRiskClue: (id: string, updates: Partial<RiskClue>) => void;
  addRiskClue: (clue: Omit<RiskClue, 'id'>) => void;

  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  selectedClueId: string | null;
  setSelectedClueId: (id: string | null) => void;
}

const initialFilters: FilterState = {
  unitIds: [],
  matterIds: [],
  personnelIds: [],
  certTypes: [],
  dateRange: null,
  riskLevels: [],
  riskTags: [],
  hasApproval: null,
  hasResult: null,
  isComplained: null,
  operationTypes: []
};

export const useAuditStore = create<AuditStore>((set, get) => ({
  callRecords: mockData.callRecords,
  riskClues: mockData.riskClues,
  units: mockData.units,
  personnel: mockData.personnel,
  matters: mockData.matters,
  evidenceChains: mockData.evidenceChains,
  complaintRecords: mockData.complaintRecords,
  unitComplianceMetrics: mockData.unitComplianceMetrics,
  dailyStats: mockData.dailyStats,
  certTypes: mockData.certTypes,

  filters: initialFilters,
  setFilters: (updates) => set((state) => ({
    filters: { ...state.filters, ...updates }
  })),
  resetFilters: () => set({ filters: initialFilters }),

  get filteredCallRecords() {
    const { callRecords, filters } = get();
    return callRecords.filter(record => {
      if (filters.unitIds.length && !filters.unitIds.includes(record.unitId)) return false;
      if (filters.matterIds.length && !filters.matterIds.includes(record.matterId)) return false;
      if (filters.personnelIds.length && !filters.personnelIds.includes(record.personnelId)) return false;
      if (filters.certTypes.length && !filters.certTypes.includes(record.certType)) return false;
      if (filters.riskLevels.length && !filters.riskLevels.includes(record.riskLevel)) return false;
      if (filters.riskTags.length && !filters.riskTags.some(t => record.riskTags.includes(t))) return false;
      if (filters.hasApproval !== null && record.hasApproval !== filters.hasApproval) return false;
      if (filters.hasResult !== null && record.hasResult !== filters.hasResult) return false;
      if (filters.isComplained !== null && record.isComplained !== filters.isComplained) return false;
      if (filters.operationTypes.length && !filters.operationTypes.includes(record.operationType)) return false;
      if (filters.dateRange) {
        const callDate = record.callTime.split(' ')[0];
        if (callDate < filters.dateRange[0] || callDate > filters.dateRange[1]) return false;
      }
      return true;
    });
  },

  updateRiskClue: (id, updates) => set((state) => ({
    riskClues: state.riskClues.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  addRiskClue: (clue) => set((state) => ({
    riskClues: [{ ...clue, id: `CL${Date.now()}` }, ...state.riskClues]
  })),

  selectedUnitId: null,
  setSelectedUnitId: (id) => set({ selectedUnitId: id }),
  selectedClueId: null,
  setSelectedClueId: (id) => set({ selectedClueId: id })
}));
