// lib/sacService.ts
import sacCodesData from "../data/SAC.json";

export interface SACCode {
  code: string;
  description: string;
}

// Convert the JSON data to match our interface
const allSACCodes: SACCode[] = sacCodesData.map(item => ({
  code: item.SAC_CD.toString(), // Convert number to string for consistent searching
  description: item.SAC_Description
}));

// Local search function
export function searchSACCodes(query: string): SACCode[] {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return allSACCodes.filter(sac =>
    sac.code.includes(query) || // Exact code match
    sac.description.toLowerCase().includes(searchTerm) || // Description match
    sac.code.startsWith(query) // Code starts with
  )
  .slice(0, 10); // Limit results for performance
}

// Optional: Async version to maintain the same interface
export async function searchSACCodesAsync(query: string): Promise<SACCode[]> {
  return Promise.resolve(searchSACCodes(query));
}

// Optional: Get SAC code by exact code match
export function getSACByCode(code: string): SACCode | undefined {
  return allSACCodes.find(sac => sac.code === code);
}

// Optional: Get all SAC codes
export function getAllSACCodes(): SACCode[] {
  return [...allSACCodes];
}