import { types, Instance, flow } from "mobx-state-tree";

export interface AgeRangeData {
  [ageRange: string]: number;
}
export interface StopSearchRecord {
  age_range: string | null;
  outcome: string | null;
  involved_person: boolean | null;
  self_defined_ethnicity: string | null;
  gender: string | null;
  legislation: string | null;
  outcome_linked_to_object_of_search: boolean | null;
  datetime: string;
  removal_of_more_than_outer_clothing: boolean | null;
  outcome_object: {
    id: string;
    name: string;
  } | null;
  location: {
    latitude: string;
    street: {
      id: number;
      name: string;
    };
    longitude: string;
  } | null;
  operation: boolean | null;
  officer_defined_ethnicity: string | null;
  type: string | null;
  operation_name: string | null;
  object_of_search: string | null;
}

export type StopSearchRecordType = StopSearchRecord;
export const DataStore = types
  .model("DataStore", {
    isLoading: types.optional(types.boolean, false),
    isInitialized: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
    totalRecords: types.optional(types.number, 0),
    recordsByMonth: types.optional(types.map(types.number), {}),
    ageRangeData: types.optional(types.frozen<AgeRangeData>(), {}),
    boroughTotals: types.optional(types.frozen<Record<string, number>>(), {}),
  })
  .actions((self) => ({
    setLoading(loading: boolean) {
      self.isLoading = loading;
    },
    setError(error: string | null) {
      self.error = error;
    },
    setInitialized(initialized: boolean) {
      self.isInitialized = initialized;
    },
    setTotalRecords(total: number) {
      self.totalRecords = total;
    },
    setAgeRangeData(data: AgeRangeData) {
      self.ageRangeData = data;
    },
    setBoroughTotals(data: Record<string, number>) {
      self.boroughTotals = data;
    },
    setRecordsByMonth(records: Record<string, number>) {
      self.recordsByMonth.clear();
      Object.entries(records).forEach(([key, value]) => {
        self.recordsByMonth.set(key, value);
      });
    },
  }))
  .actions((self) => ({
    loadStats: flow(function* () {
      if (self.isInitialized) return;

      self.setLoading(true);
      self.setError(null);

      try {
        const response = yield fetch("/api/data/stats");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = yield response.json();
        self.setTotalRecords(data.totalRecords);
        self.setRecordsByMonth(data.recordsByMonth);
        self.setInitialized(true);
      } catch (error) {
        console.error("Error loading stats:", error);
        self.setError(
          error instanceof Error ? error.message : "Failed to load data stats",
        );
      } finally {
        self.setLoading(false);
      }
    }),
  }))
  .views((self) => ({
    get recordsByMonthObject() {
      const result: Record<string, number> = {};
      self.recordsByMonth.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    },
  }))
  .actions((self) => ({
    getTotal: flow(function* (
      dateStart?: string,
      dateEnd?: string,
      filterField?: keyof StopSearchRecordType,
      filterValue?: string,
    ) {
      try {
        const params = new URLSearchParams();

        if (dateStart) params.append("dateStart", dateStart);
        if (dateEnd) params.append("dateEnd", dateEnd);
        if (filterField) params.append("filterField", filterField);
        if (filterValue) params.append("filterValue", filterValue);

        const response = yield fetch(`/api/data/total?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = yield response.json();
        return data.total;
      } catch (error) {
        console.error("Error getting total:", error);
        self.setError(
          error instanceof Error ? error.message : "Failed to get total",
        );
        return 0;
      }
    }),
    
    fetchAgeRangeData: flow(function* (startDate?: string, endDate?: string) {
      try {
        self.setLoading(true);
        self.setError(null);
        
        const params = new URLSearchParams();
        if (startDate) params.append("dateStart", startDate);
        if (endDate) params.append("dateEnd", endDate);
        
        const response = yield fetch(`/api/data/age-ranges?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = yield response.json();
        self.setAgeRangeData(data.data);
        return data.data;
      } catch (error) {
        console.error("Error fetching age range data:", error);
        self.setError(
          error instanceof Error ? error.message : "Failed to fetch age range data"
        );
        return null;
      } finally {
        self.setLoading(false);
      }
    }),

    fetchBoroughTotals: flow(function* (startDate?: string, endDate?: string) {
      try {
        self.setLoading(true);
        self.setError(null);

        const params = new URLSearchParams();
        if (startDate) params.append("dateStart", startDate);
        if (endDate) params.append("dateEnd", endDate);

        const response = yield fetch(`/api/data/borough-totals?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = yield response.json();
        // expected shape: { totals: { Camden: 123, Hackney: 456, ... } }
        self.setBoroughTotals(data.totals);
        return data.totals as Record<string, number>;
      } catch (error) {
        console.error("Error fetching borough totals:", error);
        self.setError(
          error instanceof Error ? error.message : "Failed to fetch borough totals",
        );
        return null;
      } finally {
        self.setLoading(false);
      }
    }),
  }));

export type DataStoreType = Instance<typeof DataStore>;
