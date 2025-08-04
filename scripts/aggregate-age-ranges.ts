import * as fs from 'fs';
import * as path from 'path';
import { parse, format } from 'date-fns';

interface SearchRecord {
  datetime: string;
  age_range: string | null;
}

interface DailyAgeRangeCount {
  [date: string]: {
    [ageRange: string]: number;
    total: number;
  };
}

// Using relative paths to avoid module resolution issues
const DATA_DIR = './data';
const OUTPUT_DIR = './data-aggregation/age_range';

async function processFiles(): Promise<void> {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Read all JSON files in the data directory
    const files = fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('.json'))
      .sort();

    const dailyCounts: DailyAgeRangeCount = {};

    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(DATA_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records: SearchRecord[] = JSON.parse(fileContent);

      records.forEach(record => {
        if (!record.datetime) return;

        // Parse the date and format as YYYY-MM-DD
        const date = parse(record.datetime, "yyyy-MM-dd'T'HH:mm:ssxxx", new Date());
        const dateKey = format(date, 'yyyy-MM-dd');
        const ageRange = record.age_range || 'not_recorded';

        // Initialize date entry if it doesn't exist
        if (!dailyCounts[dateKey]) {
          dailyCounts[dateKey] = { total: 0 };
        }

        // Initialize age range count if it doesn't exist
        if (!dailyCounts[dateKey][ageRange]) {
          dailyCounts[dateKey][ageRange] = 0;
        }

        // Increment counts
        dailyCounts[dateKey][ageRange]++;
        dailyCounts[dateKey].total++;
      });
    }

    // Sort dates chronologically
    const sortedDates = Object.keys(dailyCounts).sort();
    const sortedData: DailyAgeRangeCount = {};
    sortedDates.forEach(date => {
      sortedData[date] = dailyCounts[date];
    });

    // Write the aggregated data to a JSON file
    const outputPath = path.join(OUTPUT_DIR, 'daily-age-ranges.json');
    fs.writeFileSync(outputPath, JSON.stringify(sortedData, null, 2));
    
    console.log(`\nAggregation complete! Data saved to: ${outputPath}`);
    console.log(`Processed ${files.length} files with data from ${sortedDates.length} days.`);

  } catch (error) {
    console.error('Error processing files:', error);
    process.exit(1);
  }
}

// Run the script
processFiles();
