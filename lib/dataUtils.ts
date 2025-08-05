import fs from "fs";
import path from "path";
import { isWithinInterval, parseISO, isAfter, isBefore } from "date-fns";

export interface OutcomeObject {
  id: string;
  name: string;
}

export interface Street {
  id: number;
  name: string;
}

export interface Location {
  latitude: string;
  street: Street;
  longitude: string;
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
  outcome_object: OutcomeObject | null;
  location: Location | null;
  operation: boolean | null;
  officer_defined_ethnicity: string | null;
  type: string | null;
  operation_name: string | null;
  object_of_search: string | null;
  borough: string | null;
}

const dataCache = new Map<string, StopSearchRecord[]>();

const getDataPath = () => {
  const enriched = path.join(process.cwd(), "data-enriched");
  if (fs.existsSync(enriched)) return enriched;
  return path.join(process.cwd(), "data");
};

export const getAvailableDataFiles = (): string[] => {
  const dataPath = getDataPath();

  if (!fs.existsSync(dataPath)) {
    return [];
  }

  return fs
    .readdirSync(dataPath)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""))
    .sort();
};

export const loadDataFile = async (
  fileName: string,
): Promise<StopSearchRecord[]> => {
  if (dataCache.has(fileName)) {
    return dataCache.get(fileName)!;
  }

  const filePath = path.join(getDataPath(), `${fileName}.json`);

  if (!fs.existsSync(filePath)) {
    console.warn(`Data file not found: ${fileName}.json`);
    return [];
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data: StopSearchRecord[] = JSON.parse(fileContent);

    dataCache.set(fileName, data);

    return data;
  } catch (error) {
    console.error(`Error loading data file ${fileName}.json:`, error);
    return [];
  }
};

export const loadAllData = async (): Promise<StopSearchRecord[]> => {
  const availableFiles = getAvailableDataFiles();
  const allRecords: StopSearchRecord[] = [];

  for (const fileName of availableFiles) {
    const records = await loadDataFile(fileName);
    allRecords.push(...records);
  }

  return allRecords;
};

export type FilterMap = Record<string, string[]>;

// Helper to derive borough name from a record. Data street names are prefixed with the borough followed by ' - '.
export const recordBorough = (rec: StopSearchRecord): string => {
  const fromField = rec.borough;
  if (fromField && fromField.length) return fromField;
  return rec.location?.street?.name?.split(' - ')[0] ?? '';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseFilters = (query: any): FilterMap => {
  const out: FilterMap = {};
  const qFilters = query?.filters as Record<string, string> | undefined;
  // Parse nested object style e.g. filters[ethnicity]=Asian via Next default parsing
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('filters[') && key.endsWith(']')) {
      const field = key.slice(8, -1); // extract text inside brackets
      if (typeof value === 'string' && value.length)
        out[field] = value.split(',').map((s) => s.trim());
    }
  }

  if (!qFilters) return out;
  Object.entries(qFilters).forEach(([field, csv]) => {
    if (typeof csv === 'string' && csv.length) out[field] = csv.split(',').map(s=>s.trim());
  });
  return out;
};

export const getTotal = async (
  dateStart?: string,
  dateEnd?: string,
  filterField?: keyof StopSearchRecord,
  filterValue?: string,
  filters: FilterMap = {},
): Promise<number> => {
  let filesToLoad: string[] = [];

  if (dateStart && dateEnd) {
    filesToLoad = getRelevantFiles(dateStart, dateEnd);
  } else {
    filesToLoad = getAvailableDataFiles();
  }

  let count = 0;

  for (const fileName of filesToLoad) {
    const records = await loadDataFile(fileName);

    for (const record of records) {
      let matches = true;

      if (dateStart && dateEnd && matches) {
        const startDate = parseISO(dateStart);
        const endDate = parseISO(dateEnd);
        const recordDate = parseISO(record.datetime);
        matches = isWithinInterval(recordDate, {
          start: startDate,
          end: endDate,
        });
      }

      if (filterField && filterValue !== undefined && matches) {
        const fieldValue = record[filterField];

        if (fieldValue === null || fieldValue === undefined) {
          matches = filterValue === "null" || filterValue === "";
        } else if (typeof fieldValue === "boolean") {
          matches = fieldValue.toString() === filterValue;
        } else if (typeof fieldValue === "object" && fieldValue !== null) {
          matches = JSON.stringify(fieldValue).includes(filterValue);
        } else {
          matches = fieldValue
            .toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
      }

      if (matches) {
        // cross filters
        for (const [field, allowedList] of Object.entries(filters)) {
          const allowed = allowedList as string[];
          const val = (record as any)[field];
          const strVal = val === undefined || val === null ? '' : String(val);
          if (!allowed.includes(strVal)) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        count++;
      }
    }
  }

  return count;
};

const getRelevantFiles = (dateStart: string, dateEnd: string): string[] => {
  const startDate = parseISO(dateStart);
  const endDate = parseISO(dateEnd);
  const availableFiles = getAvailableDataFiles();

  return availableFiles.filter((fileName) => {
    const [year, month] = fileName.split("-").map(Number);
    if (!year || !month) return false;

    const fileStartDate = new Date(year, month - 1, 1);
    const fileEndDate = new Date(year, month, 0, 23, 59, 59);

    return (
      isWithinInterval(fileStartDate, { start: startDate, end: endDate }) ||
      isWithinInterval(fileEndDate, { start: startDate, end: endDate }) ||
      (fileStartDate <= startDate && fileEndDate >= endDate)
    );
  });
};

export const getRecordsByMonth = async (): Promise<Record<string, number>> => {
  const availableFiles = getAvailableDataFiles();
  const monthCounts: Record<string, number> = {};

  for (const fileName of availableFiles) {
    const records = await loadDataFile(fileName);

    records.forEach((record) => {
      const date = parseISO(record.datetime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
  }

  return monthCounts;
};

export const getTotalRecords = async (): Promise<number> => {
  const availableFiles = getAvailableDataFiles();
  let total = 0;

  for (const fileName of availableFiles) {
    const records = await loadDataFile(fileName);
    total += records.length;
  }

  return total;
};

export const clearCache = (): void => {
  dataCache.clear();
};

export interface AgeRangeData {
  [ageRange: string]: number;
}

export const getAgeRangeData = async (
  dateStart?: string,
  dateEnd?: string
): Promise<AgeRangeData> => {
  const allData = await loadAllData();
  const ageRangeData: AgeRangeData = {};
  
  // Convert date strings to Date objects for comparison
  const startDate = dateStart ? parseISO(dateStart) : null;
  const endDate = dateEnd ? parseISO(dateEnd) : null;

  allData.forEach(record => {
    // Skip if record has no age range
    if (!record.age_range) return;
    
    // Skip if date is outside the specified range
    if (startDate || endDate) {
      const recordDate = parseISO(record.datetime);
      if (startDate && isBefore(recordDate, startDate)) return;
      if (endDate && isAfter(recordDate, endDate)) return;
    }
    
    // Initialize age range count if it doesn't exist
    if (!ageRangeData[record.age_range]) {
      ageRangeData[record.age_range] = 0;
    }
    
    // Increment count for this age range
    ageRangeData[record.age_range]++;
  });

  return ageRangeData;
};
