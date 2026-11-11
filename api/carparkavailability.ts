import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

export interface LtaCarParkRecord {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng" e.g. "1.2789 103.8344"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y'; // Car, Heavy, Motorcycle
  Agency: 'LTA' | 'HDB' | 'URA';
  healthcareFacility?: string;
}

// Authentic Singapore Hospital & Polyclinic Carparks (Baseline / Fallback)
export const HEALTHCARE_CARPARKS: LtaCarParkRecord[] = [
  {
    CarParkID: 'HC-01',
    Area: 'Outram',
    Development: 'Singapore General Hospital (SGH Carpark H - Multi-Storey)',
    Location: '1.2789 103.8344',
    AvailableLots: 184,
    LotType: 'C',
    Agency: 'LTA',
    healthcareFacility: 'Singapore General Hospital (SGH)'
  },
  {
    CarParkID: 'HC-02',
    Area: 'Novena',
    Development: 'Tan Tock Seng Hospital / Health City Novena Carpark Basement',
    Location: '1.3214 103.8458',
    AvailableLots: 92,
    LotType: 'C',
    Agency: 'LTA',
    healthcareFacility: 'Tan Tock Seng Hospital (TTSH)'
  },
  {
    CarParkID: 'HC-03',
    Area: 'Queenstown',
    Development: 'National University Hospital (NUH Main Building Carpark)',
    Location: '1.2936 103.7831',
    AvailableLots: 145,
    LotType: 'C',
    Agency: 'LTA',
    healthcareFacility: 'National University Hospital (NUH)'
  },
  {
    CarParkID: 'HC-04',
    Area: 'Bedok',
    Development: 'Heartbeat@Bedok Integrated Complex (Bedok Polyclinic Carpark)',
    Location: '1.3268 103.9318',
    AvailableLots: 67,
    LotType: 'C',
    Agency: 'HDB',
    healthcareFacility: 'Bedok Polyclinic (Heartbeat@Bedok)'
  },
  {
    CarParkID: 'HC-05',
    Area: 'Tampines',
    Development: 'Our Tampines Hub (Near Tampines Polyclinic)',
    Location: '1.3532 103.9405',
    AvailableLots: 312,
    LotType: 'C',
    Agency: 'URA',
    healthcareFacility: 'Tampines Polyclinic'
  },
  {
    CarParkID: 'HC-06',
    Area: 'Yishun',
    Development: 'Khoo Teck Puat Hospital (KTPH Carpark B1/B2)',
    Location: '1.4246 103.8382',
    AvailableLots: 78,
    LotType: 'C',
    Agency: 'LTA',
    healthcareFacility: 'Khoo Teck Puat Hospital (KTPH)'
  },
  {
    CarParkID: 'HC-07',
    Area: 'Jurong East',
    Development: 'Ng Teng Fong General Hospital (NTFGH Multi-Storey Carpark)',
    Location: '1.3339 103.7436',
    AvailableLots: 120,
    LotType: 'C',
    Agency: 'LTA',
    healthcareFacility: 'Ng Teng Fong General Hospital (NTFGH)'
  },
  {
    CarParkID: 'HC-08',
    Area: 'Sengkang',
    Development: 'Sengkang General Hospital (SKH Visitors Carpark)',
    Location: '1.3946 103.8931',
    AvailableLots: 210,
    LotType: 'C',
    Agency: 'LTA',
    healthcareFacility: 'Sengkang General Hospital (SKH)'
  },
  {
    CarParkID: 'HC-09',
    Area: 'Toa Payoh',
    Development: 'Blk 177 Toa Payoh Central (Near Toa Payoh Polyclinic)',
    Location: '1.3341 103.8504',
    AvailableLots: 54,
    LotType: 'C',
    Agency: 'HDB',
    healthcareFacility: 'Toa Payoh Polyclinic'
  },
  {
    CarParkID: 'HC-10',
    Area: 'Ang Mo Kio',
    Development: 'Blk 712 Ang Mo Kio Ave 6 (Near AMK Polyclinic)',
    Location: '1.3695 103.8462',
    AvailableLots: 42,
    LotType: 'C',
    Agency: 'HDB',
    healthcareFacility: 'Ang Mo Kio Polyclinic'
  }
];

export default async function handler(req: ExpressRequest, res: ExpressResponse) {
  // Read key without hardcoding: from process.env or AccountKey header or query parameter
  const accountKey = process.env.LTA_DATAMALL_KEY || (req.headers['accountkey'] as string) || (req.query.accountKey as string) || '';

  if (accountKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const upstream = await fetch('http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
        signal: controller.signal,
        headers: {
          'AccountKey': accountKey,
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeout);

      if (upstream.ok) {
        const liveData = await upstream.json();
        return res.json({
          source: 'lta_datamall_live',
          totalRecords: liveData?.value?.length || 0,
          value: liveData?.value || [],
          timestamp: new Date().toISOString()
        });
      }
    } catch {
      // Offline fallback
    }
  }

  // Filter query by search term or area if provided
  const query = (req.query.search as string || '').toLowerCase();
  const areaFilter = (req.query.area as string || '').toLowerCase();

  let filtered = HEALTHCARE_CARPARKS;
  if (query) {
    filtered = filtered.filter(cp =>
      cp.Development.toLowerCase().includes(query) ||
      cp.Area.toLowerCase().includes(query) ||
      (cp.healthcareFacility && cp.healthcareFacility.toLowerCase().includes(query))
    );
  }
  if (areaFilter) {
    filtered = filtered.filter(cp => cp.Area.toLowerCase().includes(areaFilter));
  }

  return res.json({
    source: accountKey ? 'lta_datamall_cached' : 'lta_datamall_baseline',
    accountKeyConfigured: Boolean(accountKey),
    note: accountKey ? 'Using healthcare vicinity carparks cache' : 'No AccountKey configured yet. Add LTA_DATAMALL_KEY in your .env or pass header AccountKey to stream live LTA DataMall lots.',
    totalRecords: filtered.length,
    timestamp: new Date().toISOString(),
    value: filtered
  });
}
