import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import fs from 'fs';
import path from 'path';

function parseCSV(csv: string) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Handle quoted strings (like "Please report...")
    const row = [];
    let inQuote = false;
    let currentField = '';
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    
    // Basic validation to ensure we have enough columns
    // The CSV has 9 columns based on the header
    if (row.length >= 9) {
      const obj: any = {};
      
      obj.application_number = row[0];
      obj.name = row[1];
      obj.phone = row[2];
      obj.program = row[3].replace(/^"|"$/g, ''); // Remove quotes if present
      obj.campus = row[4];
      
      // Date conversion: 12/12/2025 -> 2025-12-12
      // Handle potential empty or invalid dates
      if (row[5] && row[5].includes('/')) {
        const [day, month, year] = row[5].split('/');
        obj.date = `${year}-${month}-${day}`;
      } else {
        obj.date = null;
      }
      
      // Time conversion: 9:00 AM -> 09:00:00
      if (row[6]) {
        const timeParts = row[6].match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1]);
          const minutes = timeParts[2];
          const ampm = timeParts[3].toUpperCase();
          
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          
          obj.time = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
        } else {
          obj.time = row[6]; // Fallback
        }
      } else {
        obj.time = null;
      }
      
      obj.location = row[7];
      obj.instructions = row[8].replace(/^"|"$/g, ''); // Remove quotes
      obj.status = 'REGISTERED';
      
      result.push(obj);
    }
  }
  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'level1 data.csv');
    console.log('Reading file from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'CSV file not found', path: filePath });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawApplicants = parseCSV(fileContent);
    
    console.log(`Parsed ${rawApplicants.length} rows`);

    // Deduplicate based on application_number
    const uniqueApplicantsMap = new Map();
    rawApplicants.forEach(app => {
      if (app.application_number) {
        uniqueApplicantsMap.set(app.application_number, app);
      }
    });
    const applicants = Array.from(uniqueApplicantsMap.values());
    
    console.log(`Unique applicants: ${applicants.length}`);

    // Insert in batches of 100
    const batchSize = 100;
    const results = [];
    const errors = [];

    for (let i = 0; i < applicants.length; i += batchSize) {
      const batch = applicants.slice(i, i + batchSize);
      const { data, error } = await supabaseAdmin
        .from('applicants')
        .upsert(batch, { onConflict: 'application_number' });
      
      if (error) {
        console.error(`Error inserting batch ${i}:`, error);
        errors.push({ batchIndex: i, error });
      } else {
        results.push(data);
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({ 
        message: 'Some batches failed', 
        totalProcessed: applicants.length,
        successBatches: results.length,
        errorBatches: errors.length,
        errors 
      });
    }

    return res.status(200).json({ 
      message: 'Successfully seeded applicants', 
      count: applicants.length,
      batches: results.length
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}
