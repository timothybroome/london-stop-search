const fs = require('fs');
const path = require('path');

/**
 * Script to parse data-enriched files and create normalized JSON structure
 * with lookup tables for age ranges, ethnicities, and boroughs
 */

const DATA_ENRICHED_DIR = path.join(__dirname, '..', 'data-enriched');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data-normalized.json');

async function normalizeData() {
  console.log('Starting data normalization...');
  
  // Sets to collect unique values
  const ageRanges = new Set();
  const ethnicities = new Set();
  const boroughs = new Set();
  
  // Array to store all search records
  const allSearchData = [];
  
  // Get all JSON files in data-enriched directory
  const files = fs.readdirSync(DATA_ENRICHED_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();
  
  console.log(`Found ${files.length} data files to process`);
  
  // First pass: collect all unique values
  for (const file of files) {
    console.log(`Processing ${file} for unique values...`);
    const filePath = path.join(DATA_ENRICHED_DIR, file);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      for (const record of data) {
        // Collect unique age ranges
        if (record.age_range) {
          ageRanges.add(record.age_range);
        }
        
        // Collect unique ethnicities (officer_defined_ethnicity)
        if (record.officer_defined_ethnicity) {
          ethnicities.add(record.officer_defined_ethnicity);
        }
        
        // Collect unique boroughs
        if (record.borough) {
          boroughs.add(record.borough);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`Found ${ageRanges.size} unique age ranges`);
  console.log(`Found ${ethnicities.size} unique ethnicities`);
  console.log(`Found ${boroughs.size} unique boroughs`);
  
  // Create lookup tables with numerical IDs
  const ageRangeMap = new Map();
  const ageRangeArray = Array.from(ageRanges).sort().map((name, index) => {
    const id = index + 1;
    ageRangeMap.set(name, id);
    return { id, name };
  });
  
  const ethnicityMap = new Map();
  const ethnicityArray = Array.from(ethnicities).sort().map((name, index) => {
    const id = index + 1;
    ethnicityMap.set(name, id);
    return { id, name };
  });
  
  const boroughMap = new Map();
  const boroughArray = Array.from(boroughs).sort().map((name, index) => {
    const id = index + 1;
    boroughMap.set(name, id);
    return { id, name };
  });
  
  console.log('Created lookup tables, now processing search data...');
  
  // Second pass: create normalized search records
  let totalRecords = 0;
  let recordId = 1; // Start numeric ID counter
  
  for (const file of files) {
    console.log(`Processing ${file} for search data...`);
    const filePath = path.join(DATA_ENRICHED_DIR, file);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      for (const record of data) {
        // Skip records with missing required fields
        if (!record.datetime || !record.age_range || !record.officer_defined_ethnicity || !record.borough) {
          continue;
        }
        
        const searchRecord = {
          id: recordId++, // Use incremental numeric ID
          t: record.datetime,
          a: ageRangeMap.get(record.age_range),
          e: ethnicityMap.get(record.officer_defined_ethnicity),
          b: boroughMap.get(record.borough)
        };
        
        allSearchData.push(searchRecord);
        totalRecords++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`Processed ${totalRecords} search records`);
  
  // Create final normalized structure
  const normalizedData = {
    ageRanges: ageRangeArray,
    ethnicities: ethnicityArray,
    boroughs: boroughArray,
    searchData: allSearchData
  };
  
  // Write to output file
  console.log(`Writing normalized data to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalizedData, null, 2));
  
  console.log('Data normalization complete!');
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Total records: ${totalRecords}`);
  console.log(`Age ranges: ${ageRangeArray.length}`);
  console.log(`Ethnicities: ${ethnicityArray.length}`);
  console.log(`Boroughs: ${boroughArray.length}`);
}

// Run the normalization
normalizeData().catch(console.error);
