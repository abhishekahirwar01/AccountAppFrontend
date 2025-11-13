// lib/hsnProduct.ts
import hsnCodesData from "../data/HSN.json";

export interface HSNCode {
  code: string;
  description: string;
}

// Convert the JSON data to match our interface
const allHSNCodes: HSNCode[] = hsnCodesData.map(item => ({
  code: item.HSN_CD.toString(),
  description: item.HSN_Description,
}));

// Local search function for HSN codes
export function searchHSNCodes(query: string): HSNCode[] {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return allHSNCodes.filter(hsn =>
    hsn.code.includes(query) || // Exact code match
    hsn.description.toLowerCase().includes(searchTerm) || // Description match
    hsn.code.startsWith(query) // Code starts with
  )
  .slice(0, 10); // Limit results for performance
}

// Search by exact HSN code
export function getHSNByCode(code: string): HSNCode | undefined {
  return allHSNCodes.find(hsn => hsn.code === code);
}



// Optional: Get all HSN codes
export function getAllHSNCodes(): HSNCode[] {
  return [...allHSNCodes];
}

// Search with advanced filters
export interface HSNSearchFilters {
  query?: string;
  chapter?: string;
  gstRate?: number;
  category?: string;
}

export function searchHSNCodesWithFilters(filters: HSNSearchFilters): HSNCode[] {
  let results = allHSNCodes;

  if (filters.query && filters.query.length >= 2) {
    const searchTerm = filters.query.toLowerCase().trim();
    results = results.filter(hsn =>
      hsn.code.includes(filters.query!) ||
      hsn.description.toLowerCase().includes(searchTerm)
  
    );
  }



  return results.slice(0, 15);
}