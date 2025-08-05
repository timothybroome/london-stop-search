import { types, Instance, flow } from "mobx-state-tree";

export const DateRange = types.model("DateRange", {
  start: types.maybe(types.string),
  end: types.maybe(types.string),
});

export type DateRangeType = Instance<typeof DateRange>;

// Normalized data types
export interface AgeRange {
  id: number;
  name: string;
}

export interface Ethnicity {
  id: number;
  name: string;
}

export interface Borough {
  id: number;
  name: string;
}

export interface SearchRecord {
  id: string;
  t: string; // datetime
  a: number; // ageRangeId
  e: number; // ethnicityId
  b: number; // boroughId
}

export interface NormalizedData {
  ageRanges: AgeRange[];
  ethnicities: Ethnicity[];
  boroughs: Borough[];
  searchData: SearchRecord[];
}

const DEFAULT_MAX_START = new Date(2022, 5, 1).toISOString(); // June 1, 2022
const DEFAULT_MAX_END = new Date(2025, 4, 31).toISOString(); // May 31, 2025

export const AppLayoutStore = types
  .model("AppLayoutStore", {
    dateRange: types.optional(DateRange, {
      start: DEFAULT_MAX_START,
      end: DEFAULT_MAX_END,
    }),
    maxDateRange: types.optional(DateRange, {
      start: DEFAULT_MAX_START,
      end: DEFAULT_MAX_END,
    }),
    filters: types.optional(types.map(types.array(types.string)), {}),
    
    // Data loading states
    isLoading: types.optional(types.boolean, false),
    isDataLoaded: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
    
    // Normalized data
    rawData: types.maybeNull(types.frozen<NormalizedData>()),
  })
  .views((self) => ({
    get formattedDateRange() {
      if (!self.dateRange?.start || !self.dateRange?.end)
        return "All Available Data";

      const start = new Date(self.dateRange.start).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      
      const end = new Date(self.dateRange.end).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      return `${start} - ${end}`;
    },
    
    // Lookup tables
    get ageRanges() {
      return self.rawData?.ageRanges || [];
    },
    
    get ethnicities() {
      return self.rawData?.ethnicities || [];
    },
    
    get boroughs() {
      return self.rawData?.boroughs || [];
    },
    
    // Lookup maps for fast access
    get ageRangeMap() {
      const map = new Map<number, string>();
      self.rawData?.ageRanges.forEach(ar => map.set(ar.id, ar.name));
      return map;
    },
    
    get ethnicityMap() {
      const map = new Map<number, string>();
      self.rawData?.ethnicities.forEach(e => map.set(e.id, e.name));
      return map;
    },
    
    get boroughMap() {
      const map = new Map<number, string>();
      self.rawData?.boroughs.forEach(b => map.set(b.id, b.name));
      return map;
    },
  }))
  .views(self => ({
    activeFilters() {
      const obj: Record<string, string[]> = {};
      self.filters.forEach((arr, key) => { if (arr.length) obj[key] = arr.slice(); });
      return obj;
    },
    filtersKey() {
      return JSON.stringify(this.activeFilters());
    },
    
    // Filtered search data based on date range and filters
    get filteredSearchData() {
      if (!self.rawData?.searchData) return [];
      
      const startDate = self.dateRange?.start ? new Date(self.dateRange.start) : null;
      const endDate = self.dateRange?.end ? new Date(self.dateRange.end) : null;
      const filters = this.activeFilters();
      
      return self.rawData.searchData.filter(record => {
        // Date filtering
        const recordDate = new Date(record.t);
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        
        // Age range filtering
        if (filters.age_range?.length) {
          const ageRangeName = self.ageRangeMap.get(record.a);
          if (!ageRangeName || !filters.age_range.includes(ageRangeName)) return false;
        }
        
        // Ethnicity filtering
        if (filters.officer_defined_ethnicity?.length) {
          const ethnicityName = self.ethnicityMap.get(record.e);
          if (!ethnicityName || !filters.officer_defined_ethnicity.includes(ethnicityName)) return false;
        }
        
        // Borough filtering
        if (filters.borough?.length) {
          const boroughName = self.boroughMap.get(record.b);
          if (!boroughName || !filters.borough.includes(boroughName)) return false;
        }
        
        return true;
      });
    },
    
    // Total count of filtered records
    get totalRecords() {
      return this.filteredSearchData.length;
    },
    
    // Age range totals from filtered data
    get ageRangeTotals() {
      const totals: Record<string, number> = {};
      this.filteredSearchData.forEach(record => {
        const ageRangeName = self.ageRangeMap.get(record.a);
        if (ageRangeName) {
          totals[ageRangeName] = (totals[ageRangeName] || 0) + 1;
        }
      });
      return totals;
    },
    
    // Ethnicity totals from filtered data
    get ethnicityTotals() {
      const totals: Record<string, number> = {};
      this.filteredSearchData.forEach(record => {
        const ethnicityName = self.ethnicityMap.get(record.e);
        if (ethnicityName) {
          totals[ethnicityName] = (totals[ethnicityName] || 0) + 1;
        }
      });
      return totals;
    },
    
    // Borough totals from filtered data
    get boroughTotals() {
      const totals: Record<string, number> = {};
      this.filteredSearchData.forEach(record => {
        const boroughName = self.boroughMap.get(record.b);
        if (boroughName) {
          totals[boroughName] = (totals[boroughName] || 0) + 1;
        }
      });
      return totals;
    },
    
    // Monthly totals from filtered data
    get monthlyTotals() {
      const totals: Record<string, number> = {};
      this.filteredSearchData.forEach(record => {
        const date = new Date(record.t);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        totals[monthKey] = (totals[monthKey] || 0) + 1;
      });
      return totals;
    },
    
    // Yearly totals from filtered data
    get yearlyTotals() {
      const totals: Record<string, number> = {};
      this.filteredSearchData.forEach(record => {
        const date = new Date(record.t);
        const yearKey = date.getFullYear().toString();
        totals[yearKey] = (totals[yearKey] || 0) + 1;
      });
      return totals;
    },
    
    // Daily totals from filtered data
    get dailyTotals() {
      const totals: Record<string, number> = {};
      this.filteredSearchData.forEach(record => {
        const date = new Date(record.t);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        totals[dayKey] = (totals[dayKey] || 0) + 1;
      });
      return totals;
    },
    
    get aggregatedTotals() {
      if (!self.dateRange.start || !self.dateRange.end) {
        return {
          aggregationType: 'year' as const,
          data: this.yearlyTotals
        };
      }
      
      const startDate = new Date(self.dateRange.start);
      const endDate = new Date(self.dateRange.end);
      
      // Helper functions to match date-fns behavior
      const isSameDay = (date1: Date, date2: Date) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
      };
      
      const isSameMonth = (date1: Date, date2: Date) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth();
      };
      
      const isSameYear = (date1: Date, date2: Date) => {
        return date1.getFullYear() === date2.getFullYear();
      };
      
      const startOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      };
      
      const endOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      };
      
      const startOfYear = (date: Date) => {
        return new Date(date.getFullYear(), 0, 1);
      };
      
      const endOfYear = (date: Date) => {
        return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      };
      
      // Check if it's a single day
      if (isSameDay(startDate, endDate)) {
        return {
          aggregationType: 'total' as const,
          data: { 'Total': this.filteredSearchData.length }
        };
      }
      // Check if it's a single month (exact month boundaries)
      else if (isSameMonth(startDate, endDate) &&
               isSameDay(startDate, startOfMonth(startDate)) &&
               isSameDay(endDate, endOfMonth(startDate))) {
        return {
          aggregationType: 'day' as const,
          data: this.dailyTotals
        };
      }
      // Check if it's a single year (exact year boundaries)
      else if (isSameYear(startDate, endDate) &&
               isSameDay(startDate, startOfYear(startDate)) &&
               isSameDay(endDate, endOfYear(startDate))) {
        return {
          aggregationType: 'month' as const,
          data: this.monthlyTotals
        };
      }
      // Multi-year range or custom range - aggregate by year
      else {
        return {
          aggregationType: 'year' as const,
          data: this.yearlyTotals
        };
      }
    }
  }))
  .actions((self) => ({
    setLoading(loading: boolean) {
      self.isLoading = loading;
    },
    
    setError(error: string | null) {
      self.error = error;
    },
    
    setRawData(data: NormalizedData) {
      self.rawData = data;
      self.isDataLoaded = true;
    },
    
    setDateRange(range: { start?: string; end?: string }) {
      if (range.start) self.dateRange.start = range.start;
      if (range.end) self.dateRange.end = range.end;
    },
    
    addFilter(field: string, value: string) {
      const list = Array.from(self.filters.get(field) ?? []) as string[];
      if (!list.includes(value)) self.filters.set(field, [...list, value]);
    },
    
    removeFilter(field: string, value: string) {
      const list = Array.from(self.filters.get(field) ?? []) as string[];
      const next = list.filter(v => v !== value);
      self.filters.set(field, next);
    },
    
    clearFilters(field?: string) {
      if (field) self.filters.set(field, []);
      else self.filters.clear();
    },
  }))
  .actions((self) => ({
    loadData: flow(function* () {
      if (self.isDataLoaded) return; // Only fetch once
      
      self.setLoading(true);
      self.setError(null);
      
      try {
        console.log('Loading normalized data...');
        const response = yield fetch('/data-normalized.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
        }
        
        const data: NormalizedData = yield response.json();
        console.log(`Loaded ${data.searchData.length} search records`);
        
        self.setRawData(data);
      } catch (error) {
        console.error('Error loading normalized data:', error);
        self.setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        self.setLoading(false);
      }
    }),
  }));

export type AppLayoutStoreType = Instance<typeof AppLayoutStore>;