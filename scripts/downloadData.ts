import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { format, subMonths } from 'date-fns';

const DATA_DIR = path.join(process.cwd(), 'data');
const API_URL = 'https://data.police.uk/api/stops-force';
const FORCE = 'metropolitan';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function downloadDataForMonth(date: Date): Promise<any[]> {
  const dateStr = format(date, 'yyyy-MM');
  const filePath = path.join(DATA_DIR, `${dateStr}.json`);
  
  if (fs.existsSync(filePath)) {
    console.log(`Data for ${dateStr} already exists, skipping...`);
    return [];
  }

  try {
    console.log(`Downloading data for ${dateStr}...`);
    const response = await axios.get(API_URL, {
      params: {
        date: dateStr,
        force: FORCE
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000,
      validateStatus: (status) => status < 500
    });

    console.log(`Response status: ${response.status}`);
    
    if (response.status === 200 && response.data) {
      fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
      console.log(`Saved data for ${dateStr}`);
      return response.data;
    } else {
      console.log(`No valid data received for ${dateStr}, status: ${response.status}`);
      return [];
    }
  } catch (error: any) {
    if (error.response) {
      console.error(`API Error for ${dateStr}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    } else if (error.request) {
      console.error(`No response received for ${dateStr}:`, error.request);
    } else {
      console.error(`Error setting up request for ${dateStr}:`, error.message);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log(`Request timeout for ${dateStr}, retrying...`);
      return new Promise(resolve => {
        setTimeout(async () => {
          resolve(await downloadDataForMonth(date));
        }, 2000);
      });
    }
    
    return [];
  }
}

async function findEndOfData(startDate: Date): Promise<Date> {
  let currentDate = new Date(startDate);
  let hasData = false;
  
  while (!hasData) {
    const data = await downloadDataForMonth(currentDate);
    if (data.length > 0) {
      hasData = true;
      break;
    }
    
    currentDate = subMonths(currentDate, 1);
    
    if (currentDate.getFullYear() < 2000) {
      throw new Error('Reached year 2000 without finding any data');
    }
  }
  
  return currentDate;
}

async function downloadAllData() {
  try {
    let currentDate = new Date();
    
    const startDate = await findEndOfData(currentDate);
    console.log(`Found start of data at ${format(startDate, 'yyyy-MM')}`);
    
    currentDate = subMonths(startDate, 1); 
    let hasData = true;
    
    while (hasData) {
      const data = await downloadDataForMonth(currentDate);
      
      if (data.length === 0) {
        hasData = false;
        console.log('Reached the end of available data');
        break;
      }
      
      currentDate = subMonths(currentDate, 1);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Data download complete!');
  } catch (error) {
    console.error('Error downloading data:', error);
    process.exit(1);
  }
}

downloadAllData();
