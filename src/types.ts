export interface PlanningArea {
  id: string;
  name: string;
  region: 'Central' | 'East' | 'West' | 'North' | 'North-East';
  coordinates: [number, number]; // [lat, lng]
  bounds?: [[number, number], [number, number]];
  totalPopulation: number;
  seniorPopulation: number; // 65+
  agingPercentage: number; // senior / total * 100
  areaSqKm: number;
  seniorDensityPerSqKm: number;
  polyclinicsCount: number;
  hospitalsCount: number;
  eldercareCentresCount: number;
  nursingHomesCount: number;
  totalHealthcareFacilities: number;
  facilitiesPer10kSeniors: number;
  pctWithin15MinWalk: number; // % seniors within 800m of healthcare
  accessibilityGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export type ActiveOverlay = 'Healthcare Facility Density' | 'Elderly Population Heatmap' | 'Public Transport Accessibility';

export interface TransitHub {
  id: string;
  name: string;
  type: 'mrt_interchange' | 'bus_interchange' | 'integrated_transport_hub';
  lines: string[];
  coordinates: [number, number];
  servesHealthcare: string;
}

export type FacilityType = 'hospital' | 'community_hospital' | 'polyclinic' | 'eldercare' | 'nursing_home';

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  typeLabel: string;
  planningArea: string;
  address: string;
  postalCode: string;
  coordinates: [number, number]; // [lat, lng]
  beds?: number;
  operatingHours: string;
  contact: string;
  services: string[];
  wheelchairAccessible: boolean;
}

export interface SingStatSearchResult {
  resourceId: string;
  tableTitle: string;
  source: string;
  theme: string;
  subject: string;
  frequency: string;
}

export interface SingStatMetadata {
  id: string;
  title: string;
  footnote: string;
  frequency: string;
  dataLastUpdated: string;
  source: string;
  unitOfMeasure: string;
  variables: {
    variableNo: string;
    variableName: string;
  }[];
}

export interface SingStatSeriesData {
  rowNo: string;
  rowText: string;
  columns: {
    key: string;
    value: string | number;
  }[];
}

export interface SingStatTableDataResponse {
  Data: {
    id: string;
    title: string;
    row: {
      rowNo: string;
      rowText: string;
      columns: {
        key: string;
        value: string;
      }[];
    }[];
  };
}

export interface OneMapSearchItem {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

export interface OneMapRouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  coordinates: [number, number]; // [lat, lng]
}

export interface OneMapRouteResult {
  route_geometry: string; // encoded or decoded coordinates
  coordinates: [number, number][];
  route_summary: {
    total_distance: number; // meters
    total_time: number; // seconds
    start_point: string;
    end_point: string;
  };
  route_instructions: OneMapRouteStep[];
}
