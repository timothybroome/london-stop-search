import { types, Instance } from "mobx-state-tree";

export const DateRange = types.model("DateRange", {
  start: types.maybe(types.string),
  end: types.maybe(types.string),
});

export type DateRangeType = Instance<typeof DateRange>;

export const AppLayoutStore = types
  .model("AppLayoutStore", {
    dateRange: types.optional(DateRange, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  })
  .views((self) => ({
    get formattedDateRange() {
      if (!self.dateRange?.start || !self.dateRange?.end) return 'All Available Data';
      
      const start = new Date(self.dateRange.start).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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