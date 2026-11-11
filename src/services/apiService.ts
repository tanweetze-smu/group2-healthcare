import { PlanningArea, HealthcareFacility, SingStatSearchResult, SingStatMetadata, SingStatTableDataResponse, OneMapSearchItem, OneMapRouteResult } from '../types';

export interface HealthcareDensityResponse {
  nationalOverview: {
    totalPopulation: number;
    seniorPopulation65Plus: number;
    overallAgingPercentage: number;
    totalPolyclinics: number;
    totalHospitals: number;
    totalEldercareCentres: number;
    totalNursingHomes: number;
    avgFacilitiesPer10kSeniors: number;
    agingSupportRatio: number;
  };
  planningAreas: PlanningArea[];
  facilities: HealthcareFacility[];
  historicalTrends: {
    year: string;
    totalPop: number;
    aged65Plus: number;
    pctAged65Plus: number;
    oldAgeSupportRatio: number;
    acuteBeds: number;
    polyclinics: number;
  }[];
}

export async function fetchHealthcareDensity(): Promise<HealthcareDensityResponse> {
  const res = await fetch('/api/data/healthcare-density');
  if (!res.ok) throw new Error('Failed to load healthcare density dataset');
  return res.json();
}

export async function searchSingStat(keyword: string, searchOption: 'all' | 'title' | 'variable' = 'title'): Promise<{ source: string; data: { data: { records: SingStatSearchResult[]; total: number } } }> {
  const res = await fetch(`/api/singstat/search?keyword=${encodeURIComponent(keyword)}&searchOption=${searchOption}`);
  if (!res.ok) throw new Error('Failed to search SingStat TableBuilder');
  return res.json();
}

export async function fetchSingStatMetadata(tableId: string): Promise<{ source: string; tableId: string; data: { data: SingStatMetadata } }> {
  const res = await fetch(`/api/singstat/metadata/${encodeURIComponent(tableId)}`);
  if (!res.ok) throw new Error(`Failed to fetch metadata for table ${tableId}`);
  return res.json();
}

export async function fetchSingStatTableData(tableId: string, params?: { limit?: number; timeFilter?: string; seriesNoORrowNo?: string }): Promise<{ source: string; tableId: string; data: SingStatTableDataResponse }> {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.timeFilter) q.set('timeFilter', params.timeFilter);
  if (params?.seriesNoORrowNo) q.set('seriesNoORrowNo', params.seriesNoORrowNo);

  const res = await fetch(`/api/singstat/tabledata/${encodeURIComponent(tableId)}${q.toString() ? '?' + q.toString() : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch table data for ${tableId}`);
  return res.json();
}

export async function mintOneMapToken(email?: string, password?: string): Promise<{ source: string; access_token: string; expiry_timestamp: number; message: string }> {
  const res = await fetch('/api/onemap/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Failed to mint OneMap authentication token');
  return res.json();
}

export async function searchOneMap(searchVal: string): Promise<{ source: string; found: number; results: OneMapSearchItem[] }> {
  const res = await fetch(`/api/onemap/search?searchVal=${encodeURIComponent(searchVal)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`);
  if (!res.ok) throw new Error('Failed to geocode location with OneMap');
  return res.json();
}

export async function reverseGeocodeOneMap(lat: number, lng: number): Promise<{ source: string; GeocodeInfo: any[] }> {
  const res = await fetch(`/api/onemap/revgeocode?location=${lat},${lng}&buffer=40&addressType=All`);
  if (!res.ok) throw new Error('Failed to reverse geocode coordinate');
  return res.json();
}

export async function calculateOneMapRoute(start: [number, number], end: [number, number], routeType: 'walk' | 'drive' | 'cycle' | 'pt' = 'walk'): Promise<{ source: string; coordinates: [number, number][]; route_summary: any; route_instructions: any[] }> {
  const res = await fetch(`/api/onemap/route?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}&routeType=${routeType}`);
  if (!res.ok) throw new Error('Failed to calculate route with OneMap');
  return res.json();
}

export async function fetchApiHealth(): Promise<any> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Failed to query API health endpoint');
  return res.json();
}

export async function fetchCarParkAvailability(search?: string, area?: string, accountKey?: string): Promise<any> {
  const q = new URLSearchParams();
  if (search) q.set('search', search);
  if (area) q.set('area', area);
  if (accountKey) q.set('accountKey', accountKey);

  const res = await fetch(`/api/carparkavailability${q.toString() ? '?' + q.toString() : ''}`, {
    headers: accountKey ? { 'AccountKey': accountKey } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch LTA DataMall carpark availability');
  return res.json();
}
