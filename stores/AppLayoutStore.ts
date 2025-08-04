import { types, Instance } from "mobx-state-tree";

export const DateRange = types.model("DateRange", {
  start: types.maybe(types.string),
  end: types.maybe(types.string),
});

export type DateRangeType = Instance<typeof DateRange>;

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
  }))
  .views(self => ({
    activeFilters() {
      const obj: Record<string, string[]> = {};
      self.filters.forEach((arr, key) => { if (arr.length) obj[key] = arr.slice(); });
      return obj;
    },
    filtersKey() {
      return JSON.stringify(this.activeFilters());
    }
  }))
  .actions((self) => ({
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
  }));

export type AppLayoutStoreType = Instance<typeof AppLayoutStore>;