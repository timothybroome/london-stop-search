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
  .actions((self) => ({
    setDateRange(range: { start?: string; end?: string }) {
      if (range.start) self.dateRange.start = range.start;
      if (range.end) self.dateRange.end = range.end;
    },
  }));

export type AppLayoutStoreType = Instance<typeof AppLayoutStore>;