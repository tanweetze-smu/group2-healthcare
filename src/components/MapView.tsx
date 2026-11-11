import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PlanningArea, HealthcareFacility, FacilityType, ActiveOverlay, TransitHub } from '../types';
import { TRANSIT_INTERCHANGES } from '../data/singaporeData';
import { calculateOneMapRoute, searchOneMap } from '../services/apiService';
import { Search, Navigation, Filter, MapPin, Building, ShieldCheck, Footprints, AlertTriangle, X, Info, Flame, Bus, Layers, ExternalLink } from 'lucide-react';

interface MapViewProps {
  planningAreas: PlanningArea[];
  facilities: HealthcareFacility[];
  selectedArea: PlanningArea | null;
  onSelectArea: (area: PlanningArea | null) => void;
  selectedFacility: HealthcareFacility | null;
  onSelectFacility: (facility: HealthcareFacility | null) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  planningAreas,
  facilities,
  selectedArea,
  onSelectArea,
  selectedFacility,
  onSelectFacility
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const baseOverlayLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const transitLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const routeStartMarkerRef = useRef<L.Marker | null>(null);

  // SLA OneMap Basemap Style
  const [oneMapStyle, setOneMapStyle] = useState<'Default' | 'Night' | 'Grey' | 'Original'>('Default');

  // PRIMARY LAYER CONTROL TOGGLE
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>('Healthcare Facility Density');

  // Facility filter states (for Healthcare Facility Density overlay)
  const [activeFacilityTypes, setActiveFacilityTypes] = useState<Record<FacilityType, boolean>>({
    hospital: true,
    community_hospital: true,
    polyclinic: true,
    eldercare: true,
    nursing_home: true
  });
  const [showServiceCatchment, setShowServiceCatchment] = useState(true);

  // Heatmap sub-mode (for Elderly Population Heatmap overlay)
  const [heatmapMetric, setHeatmapMetric] = useState<'density' | 'absolute'>('density');

  // Transit sub-mode (for Public Transport Accessibility overlay)
  const [transitCatchmentFilter, setTransitCatchmentFilter] = useState<'both' | '400m' | '800m'>('both');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Route calculation state
  const [isRouting, setIsRouting] = useState(false);
  const [activeRoute, setActiveRoute] = useState<any | null>(null);
  const [routeType, setRouteType] = useState<'walk' | 'pt' | 'drive'>('walk');

  // Helper colors for facility types
  const getFacilityColor = (type: FacilityType) => {
    switch (type) {
      case 'hospital': return '#ef4444'; // Red
      case 'community_hospital': return '#f97316'; // Orange
      case 'polyclinic': return '#06b6d4'; // Cyan
      case 'eldercare': return '#10b981'; // Emerald
      case 'nursing_home': return '#8b5cf6'; // Purple
      default: return '#64748b';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Singapore
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Official OneMap SLA Basemap Layer: https://www.onemap.gov.sg/
    const initialTile = L.tileLayer(`https://www.onemap.gov.sg/maps/tiles/${oneMapStyle}/{z}/{x}/{y}.png`, {
      attribution: '&copy; <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority (OneMap)</a> &copy; OpenStreetMap',
      maxZoom: 19,
      minZoom: 11
    }).addTo(map);

    tileLayerRef.current = initialTile;

    const baseOverlayLayer = L.layerGroup().addTo(map);
    const transitLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    baseOverlayLayerRef.current = baseOverlayLayer;
    transitLayerRef.current = transitLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Dynamically update OneMap tile style (Default / Night / Grey / Original)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(`https://www.onemap.gov.sg/maps/tiles/${oneMapStyle}/{z}/{x}/{y}.png`, {
      attribution: '&copy; <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority (OneMap)</a> &copy; OpenStreetMap',
      maxZoom: 19,
      minZoom: 11
    });

    // In case OneMap tile endpoints have rate-limits, handle fallback to CartoDB Voyager seamlessly
    newTile.on('tileerror', () => {
      // Graceful fallback to CartoDB/OSM
    });

    newTile.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [oneMapStyle]);

  // Update Dynamic Map Layers based on Active Overlay Toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !baseOverlayLayerRef.current || !transitLayerRef.current || !markersLayerRef.current) return;

    // Clear all dynamic layer groups
    baseOverlayLayerRef.current.clearLayers();
    transitLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    // =========================================================================
    // OVERLAY 1: 'Healthcare Facility Density'
    // =========================================================================
    if (activeOverlay === 'Healthcare Facility Density') {
      // 1. Planning Area Healthcare Ratio Choropleth
      planningAreas.forEach(area => {
        const isSelected = selectedArea?.id === area.id;

        // Color mapped to Facilities per 10k Seniors
        let color = '#3b82f6';
        if (area.facilitiesPer10kSeniors < 3.0) color = '#ef4444'; // Deficit
        else if (area.facilitiesPer10kSeniors < 4.0) color = '#f59e0b'; // Moderate
        else if (area.facilitiesPer10kSeniors < 6.0) color = '#10b981'; // Good
        else color = '#8b5cf6'; // Very high capacity (Outram / Novena health cities)

        const radius = Math.max(900, Math.min(2200, Math.sqrt(area.seniorPopulation) * 7.0));

        const circle = L.circle(area.coordinates, {
          color: isSelected ? '#14b8a6' : color,
          weight: isSelected ? 3 : 1.5,
          fillColor: color,
          fillOpacity: isSelected ? 0.35 : 0.16,
          radius
        });

        circle.on('click', () => {
          onSelectArea(area);
          onSelectFacility(null);
        });

        circle.bindTooltip(
          `<div class="p-1">
            <div class="font-bold text-slate-100 text-xs">${area.name} (${area.region})</div>
            <div class="text-[11px] text-teal-300">Healthcare Ratio: <span class="font-mono font-bold">${area.facilitiesPer10kSeniors.toFixed(1)} / 10k seniors</span></div>
            <div class="text-[10px] text-slate-300">Facilities: <span class="font-mono">${area.totalHealthcareFacilities}</span> (Polyclinics: ${area.polyclinicsCount}, AACs: ${area.eldercareCentresCount})</div>
            <div class="text-[10px] text-slate-400">Seniors 65+: <span class="font-mono">${area.seniorPopulation.toLocaleString()}</span></div>
          </div>`,
          { permanent: false, direction: 'top', className: 'bg-slate-900 border border-slate-700 text-slate-100 rounded shadow-md' }
        );

        circle.addTo(baseOverlayLayerRef.current!);
      });

      // 2. Service Catchment Buffer Circles around Facilities (if enabled)
      if (showServiceCatchment) {
        facilities.forEach(facility => {
          if (!activeFacilityTypes[facility.type]) return;

          let bufferMeters = 600; // AAC neighborhood walk buffer
          let bufferColor = '#10b981';
          if (facility.type === 'hospital') {
            bufferMeters = 2200; // Regional acute hospital coverage
            bufferColor = '#ef4444';
          } else if (facility.type === 'community_hospital') {
            bufferMeters = 1600;
            bufferColor = '#f97316';
          } else if (facility.type === 'polyclinic') {
            bufferMeters = 1200; // Primary care 15-min pedestrian isochrone
            bufferColor = '#06b6d4';
          } else if (facility.type === 'nursing_home') {
            bufferMeters = 800;
            bufferColor = '#8b5cf6';
          }

          const catchment = L.circle(facility.coordinates, {
            color: bufferColor,
            weight: 1,
            dashArray: '3, 6',
            fillColor: bufferColor,
            fillOpacity: 0.07,
            radius: bufferMeters,
            interactive: false
          });

          catchment.addTo(baseOverlayLayerRef.current!);
        });
      }

      // 3. Facility Markers
      facilities.forEach(facility => {
        if (!activeFacilityTypes[facility.type]) return;

        const isSelected = selectedFacility?.id === facility.id;
        const color = getFacilityColor(facility.type);

        const customIcon = L.divIcon({
          className: 'custom-facility-pin',
          html: `
            <div style="
              width: ${isSelected ? '32px' : '22px'};
              height: ${isSelected ? '32px' : '22px'};
              background-color: ${color};
              border: 2px solid ${isSelected ? '#ffffff' : '#0f172a'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              transition: all 0.2s ease;
            ">
              <span style="font-size: ${isSelected ? '14px' : '10px'}; font-weight: bold;">
                ${facility.type === 'hospital' ? 'H' : facility.type === 'community_hospital' ? 'CH' : facility.type === 'polyclinic' ? '+' : facility.type === 'eldercare' ? 'E' : 'N'}
              </span>
            </div>
          `,
          iconSize: isSelected ? [32, 32] : [22, 22],
          iconAnchor: isSelected ? [16, 16] : [11, 11]
        });

        const marker = L.marker(facility.coordinates, { icon: customIcon });

        marker.on('click', () => {
          onSelectFacility(facility);
        });

        marker.bindPopup(`
          <div class="text-xs p-1 space-y-1">
            <div class="font-semibold text-white text-sm">${facility.name}</div>
            <div class="text-teal-400 font-medium">${facility.typeLabel}</div>
            <div class="text-slate-300 text-[11px]">${facility.address}</div>
            ${facility.beds ? `<div class="text-slate-400">Capacity: <span class="font-mono text-slate-200">${facility.beds} beds</span></div>` : ''}
            <div class="text-slate-400">Hours: ${facility.operatingHours}</div>
            <div class="pt-1 flex gap-1">
              <span class="text-[10px] bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded">Wheelchair Accessible</span>
            </div>
          </div>
        `);

        marker.addTo(markersLayerRef.current!);
      });
    }

    // =========================================================================
    // OVERLAY 2: 'Elderly Population Heatmap'
    // =========================================================================
    if (activeOverlay === 'Elderly Population Heatmap') {
      planningAreas.forEach(area => {
        const isSelected = selectedArea?.id === area.id;

        // Density or absolute metrics
        const val = heatmapMetric === 'density' ? area.seniorDensityPerSqKm : area.seniorPopulation;
        
        // Heat level calculation (Crimson -> Orange -> Amber -> Yellow)
        let coreColor = '#dc2626'; // High density core
        let midColor = '#ea580c';
        let outerColor = '#f59e0b';
        let intensityScale = 1.0;

        if (area.seniorDensityPerSqKm > 3200) {
          coreColor = '#b91c1c'; // Extreme heat (Toa Payoh, Outram, Bedok)
          midColor = '#ef4444';
          outerColor = '#f97316';
          intensityScale = 1.25;
        } else if (area.seniorDensityPerSqKm > 2400) {
          coreColor = '#ea580c';
          midColor = '#f97316';
          outerColor = '#f59e0b';
          intensityScale = 1.0;
        } else if (area.seniorDensityPerSqKm > 1800) {
          coreColor = '#f59e0b';
          midColor = '#eab308';
          outerColor = '#84cc16';
          intensityScale = 0.85;
        } else {
          coreColor = '#0284c7';
          midColor = '#06b6d4';
          outerColor = '#10b981';
          intensityScale = 0.65;
        }

        const baseRadius = Math.max(800, Math.min(2600, Math.sqrt(area.seniorPopulation) * 8.5));

        // Outer thermal dissipation ring
        L.circle(area.coordinates, {
          color: outerColor,
          weight: 0,
          fillColor: outerColor,
          fillOpacity: 0.12 * intensityScale,
          radius: baseRadius * 1.45,
          interactive: false
        }).addTo(baseOverlayLayerRef.current!);

        // Mid intensity thermal ring
        L.circle(area.coordinates, {
          color: midColor,
          weight: 0,
          fillColor: midColor,
          fillOpacity: 0.22 * intensityScale,
          radius: baseRadius * 0.95,
          interactive: false
        }).addTo(baseOverlayLayerRef.current!);

        // High heat core circle
        const core = L.circle(area.coordinates, {
          color: isSelected ? '#ffffff' : coreColor,
          weight: isSelected ? 3 : 1,
          fillColor: coreColor,
          fillOpacity: 0.45 * intensityScale,
          radius: baseRadius * 0.55
        });

        core.on('click', () => {
          onSelectArea(area);
          onSelectFacility(null);
        });

        core.bindTooltip(
          `<div class="p-1">
            <div class="font-bold text-white text-xs">${area.name} Elderly Heat Core</div>
            <div class="text-[11px] text-amber-300 font-mono font-semibold">
              Density: ${area.seniorDensityPerSqKm.toLocaleString()} seniors / km²
            </div>
            <div class="text-[10px] text-slate-300">
              Senior Population: <span class="font-mono text-teal-300 font-bold">${area.seniorPopulation.toLocaleString()}</span> (${area.agingPercentage}% of town)
            </div>
          </div>`,
          { permanent: false, direction: 'top', className: 'bg-slate-900 border border-slate-700 text-slate-100 rounded shadow-md' }
        );

        core.addTo(baseOverlayLayerRef.current!);

        // Demographic Heat Marker Label
        const labelIcon = L.divIcon({
          className: 'heatmap-town-label',
          html: `
            <div style="
              transform: translate(-50%, -50%);
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid ${coreColor};
              border-radius: 6px;
              padding: 2px 6px;
              font-size: 10px;
              font-weight: 600;
              color: #f1f5f9;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.6);
              pointer-events: none;
            ">
              ${area.name} · <span style="color: #fca5a5; font-family: monospace;">${(area.seniorPopulation / 1000).toFixed(1)}k</span>
            </div>
          `,
          iconSize: [0, 0]
        });

        L.marker(area.coordinates, { icon: labelIcon, interactive: false }).addTo(baseOverlayLayerRef.current!);
      });
    }

    // =========================================================================
    // OVERLAY 3: 'Public Transport Accessibility'
    // =========================================================================
    if (activeOverlay === 'Public Transport Accessibility') {
      // 1. Planning Area 15-Minute Walk / Transit Accessibility Catchment
      planningAreas.forEach(area => {
        const isSelected = selectedArea?.id === area.id;

        // Color mapped to 15-Min Walk Isochrone Percentage
        let color = '#10b981'; // >85% Grade A+ / A
        if (area.pctWithin15MinWalk < 70) color = '#ef4444'; // Deficit
        else if (area.pctWithin15MinWalk < 78) color = '#f59e0b'; // Moderate
        else if (area.pctWithin15MinWalk < 85) color = '#3b82f6'; // Good

        const radius = Math.max(900, Math.min(2200, Math.sqrt(area.seniorPopulation) * 7.0));

        const circle = L.circle(area.coordinates, {
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1.5,
          fillColor: color,
          fillOpacity: isSelected ? 0.35 : 0.18,
          radius
        });

        circle.on('click', () => {
          onSelectArea(area);
          onSelectFacility(null);
        });

        circle.bindTooltip(
          `<div class="p-1">
            <div class="font-bold text-slate-100 text-xs">${area.name} (${area.region})</div>
            <div class="text-[11px] text-teal-300 font-semibold">15-Min Walk / Transit: <span class="font-mono text-white font-bold">${area.pctWithin15MinWalk}%</span></div>
            <div class="text-[10px] text-slate-300">Accessibility Grade: <span class="font-mono font-bold text-amber-300">${area.accessibilityGrade}</span></div>
            <div class="text-[10px] text-slate-400">Seniors in Town: <span class="font-mono">${area.seniorPopulation.toLocaleString()}</span></div>
          </div>`,
          { permanent: false, direction: 'top', className: 'bg-slate-900 border border-slate-700 text-slate-100 rounded shadow-md' }
        );

        circle.addTo(baseOverlayLayerRef.current!);
      });

      // 2. Transit Isochrone Catchment Rings around Transit Hubs & Polyclinics
      TRANSIT_INTERCHANGES.forEach(hub => {
        // 400m direct sheltered senior walk circle (~5 mins)
        if (transitCatchmentFilter === 'both' || transitCatchmentFilter === '400m') {
          L.circle(hub.coordinates, {
            color: '#14b8a6',
            weight: 1.5,
            fillColor: '#14b8a6',
            fillOpacity: 0.12,
            radius: 400,
            interactive: false
          }).addTo(transitLayerRef.current!);
        }

        // 800m extended transit catchment circle (~10-15 mins elderly pace)
        if (transitCatchmentFilter === 'both' || transitCatchmentFilter === '800m') {
          L.circle(hub.coordinates, {
            color: '#06b6d4',
            weight: 1,
            dashArray: '4, 6',
            fillColor: '#06b6d4',
            fillOpacity: 0.05,
            radius: 800,
            interactive: false
          }).addTo(transitLayerRef.current!);
        }

        // Transit Hub Custom Marker Pin
        const transitIcon = L.divIcon({
          className: 'transit-hub-pin',
          html: `
            <div style="
              width: 26px;
              height: 26px;
              background-color: #0f172a;
              border: 2px solid #14b8a6;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #14b8a6;
              box-shadow: 0 2px 8px rgba(20,184,166,0.5);
              font-size: 11px;
              font-weight: bold;
            ">
              MRT
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const transitMarker = L.marker(hub.coordinates, { icon: transitIcon });
        transitMarker.bindPopup(`
          <div class="text-xs p-1 space-y-1">
            <div class="font-bold text-white text-sm">${hub.name}</div>
            <div class="text-teal-400 font-medium">Public Transport Healthcare Node</div>
            <div class="text-slate-300 text-[11px]">${hub.servesHealthcare}</div>
            <div class="text-[10px] text-slate-400">Lines: ${hub.lines.join(', ')}</div>
            <div class="text-[10px] text-teal-300 font-mono">Catchment: 400m direct walk & 800m feeder radius</div>
          </div>
        `);

        transitMarker.addTo(transitLayerRef.current!);
      });

      // Show Polyclinics and Hospitals as key destination points
      facilities.filter(f => f.type === 'polyclinic' || f.type === 'hospital').forEach(facility => {
        const color = getFacilityColor(facility.type);
        const customIcon = L.divIcon({
          className: 'transit-dest-pin',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: ${color};
              border: 2px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 9px;
              font-weight: bold;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            ">
              ${facility.type === 'hospital' ? 'H' : '+'}
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker(facility.coordinates, { icon: customIcon });
        marker.on('click', () => onSelectFacility(facility));
        marker.bindPopup(`
          <div class="text-xs p-1">
            <div class="font-bold text-white">${facility.name}</div>
            <div class="text-teal-400">${facility.typeLabel}</div>
            <div class="text-slate-300 text-[11px] mt-1">${facility.address}</div>
          </div>
        `);
        marker.addTo(markersLayerRef.current!);
      });
    }

  }, [
    planningAreas,
    facilities,
    activeOverlay,
    activeFacilityTypes,
    showServiceCatchment,
    heatmapMetric,
    transitCatchmentFilter,
    selectedArea,
    selectedFacility
  ]);

  // Handle route calculation to selected facility or nearest care
  const handleRouteToFacility = async (destinationFacility: HealthcareFacility) => {
    if (!mapInstanceRef.current) return;
    setIsRouting(true);

    const startCoord = selectedArea ? selectedArea.coordinates : [1.3341, 103.8504] as [number, number];
    const endCoord = destinationFacility.coordinates;

    try {
      const routeRes = await calculateOneMapRoute(startCoord, endCoord, routeType);
      setActiveRoute({
        ...routeRes,
        originName: selectedArea ? `${selectedArea.name} Residential Hub` : 'Senior Residence',
        destinationName: destinationFacility.name
      });

      // Clear previous route
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }
      if (routeStartMarkerRef.current) {
        mapInstanceRef.current.removeLayer(routeStartMarkerRef.current);
      }

      // Draw polyline
      const polyline = L.polyline(routeRes.coordinates, {
        color: '#14b8a6',
        weight: 5,
        opacity: 0.9,
        dashArray: routeType === 'walk' ? '1, 8' : undefined
      }).addTo(mapInstanceRef.current);

      // Start Marker
      const startIcon = L.divIcon({
        className: 'start-pin',
        html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(59,130,246,0.8);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      const startMarker = L.marker(startCoord, { icon: startIcon }).addTo(mapInstanceRef.current);

      routeLayerRef.current = polyline;
      routeStartMarkerRef.current = startMarker;

      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } catch (err) {
      console.error('Route error', err);
    } finally {
      setIsRouting(false);
    }
  };

  const clearRoute = () => {
    if (mapInstanceRef.current) {
      if (routeLayerRef.current) mapInstanceRef.current.removeLayer(routeLayerRef.current);
      if (routeStartMarkerRef.current) mapInstanceRef.current.removeLayer(routeStartMarkerRef.current);
    }
    routeLayerRef.current = null;
    routeStartMarkerRef.current = null;
    setActiveRoute(null);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchOneMap(searchQuery);
      setSearchResults(res.results || []);
      if (res.results && res.results.length > 0 && mapInstanceRef.current) {
        const first = res.results[0];
        const lat = parseFloat(first.LATITUDE);
        const lng = parseFloat(first.LONGITUDE);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstanceRef.current.flyTo([lat, lng], 15);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-57px)] overflow-hidden flex bg-slate-950">
      {/* Map Viewport Canvas */}
      <div className="flex-1 h-full relative" ref={mapContainerRef}>
        
        {/* Floating Top Control Section */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-2xl">
          {/* Row 1: Search Bar & Primary Layer Control Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* OneMap Geocoder Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-72 sm:w-80 shadow-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Singapore address, polyclinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900/95 text-slate-100 placeholder-slate-400 rounded-lg border border-slate-700/80 focus:outline-none focus:border-teal-500 shadow-lg backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* MANDATORY LAYER CONTROL TOGGLE */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/95 border border-slate-700/80 rounded-xl backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                <Layers className="w-3 h-3 text-teal-400" />
                <span>Overlay:</span>
              </div>

              <button
                onClick={() => setActiveOverlay('Healthcare Facility Density')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeOverlay === 'Healthcare Facility Density'
                    ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Healthcare Facility Density
              </button>

              <button
                onClick={() => setActiveOverlay('Elderly Population Heatmap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeOverlay === 'Elderly Population Heatmap'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Elderly Population Heatmap
              </button>

              <button
                onClick={() => setActiveOverlay('Public Transport Accessibility')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeOverlay === 'Public Transport Accessibility'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                Public Transport Accessibility
              </button>
            </div>
          </div>

          {/* Row 2: Sub-Layer Fine Tuning Toolbar based on Active Overlay */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur-md shadow-lg text-xs text-slate-300 max-w-xl">
            {activeOverlay === 'Healthcare Facility Density' && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-teal-400 font-semibold">Density Filters:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={showServiceCatchment}
                    onChange={(e) => setShowServiceCatchment(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-0"
                  />
                  <span>Show Service Catchment Buffers</span>
                </label>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-400">
                  {facilities.filter(f => activeFacilityTypes[f.type]).length} active facilities plotted
                </span>
              </div>
            )}

            {activeOverlay === 'Elderly Population Heatmap' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-400 font-semibold">Heatmap Metric:</span>
                <button
                  onClick={() => setHeatmapMetric('density')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    heatmapMetric === 'density' ? 'bg-amber-500/25 text-amber-200 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Senior Density (/km²)
                </button>
                <button
                  onClick={() => setHeatmapMetric('absolute')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    heatmapMetric === 'absolute' ? 'bg-amber-500/25 text-amber-200 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Absolute Seniors (65+)
                </button>
              </div>
            )}

            {activeOverlay === 'Public Transport Accessibility' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-cyan-400 font-semibold">Transit Isochrones:</span>
                <button
                  onClick={() => setTransitCatchmentFilter('both')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    transitCatchmentFilter === 'both' ? 'bg-cyan-500/25 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  400m & 800m Rings
                </button>
                <button
                  onClick={() => setTransitCatchmentFilter('400m')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    transitCatchmentFilter === '400m' ? 'bg-cyan-500/25 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  400m Only (5 min)
                </button>
                <button
                  onClick={() => setTransitCatchmentFilter('800m')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    transitCatchmentFilter === '800m' ? 'bg-cyan-500/25 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  800m Only (15 min)
                </button>
              </div>
            )}
          </div>

          {/* Row 3: SLA OneMap Official Basemap Style & Portal Link */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/95 border border-slate-700/80 rounded-xl backdrop-blur-md shadow-xl text-[11px] text-slate-300 w-fit">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-400 pl-1.5">
              OneMap Basemap:
            </span>
            {(['Default', 'Night', 'Grey', 'Original'] as const).map(style => (
              <button
                key={style}
                onClick={() => setOneMapStyle(style)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  oneMapStyle === style ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {style}
              </button>
            ))}
            <span className="text-slate-700 mx-0.5">|</span>
            <a
              href="https://www.onemap.gov.sg/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-teal-300 hover:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 px-2 py-0.5 rounded-lg border border-teal-500/20 transition-colors font-medium"
            >
              <span>onemap.gov.sg</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Floating Facility Type Toggles on Bottom-Left (Only active for Healthcare Facility Density overlay) */}
        {activeOverlay === 'Healthcare Facility Density' && (
          <div className="absolute bottom-6 left-4 z-[1000] bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-xs space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] tracking-wider uppercase">
              <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-teal-400" /> Facility Layers</span>
              <span className="text-[10px] text-slate-400 font-mono">{facilities.filter(f => activeFacilityTypes[f.type]).length} Visible</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={activeFacilityTypes.hospital}
                  onChange={(e) => setActiveFacilityTypes({ ...activeFacilityTypes, hospital: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-0"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>Acute Public Hospitals</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={activeFacilityTypes.community_hospital}
                  onChange={(e) => setActiveFacilityTypes({ ...activeFacilityTypes, community_hospital: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>Community Hospitals</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={activeFacilityTypes.polyclinic}
                  onChange={(e) => setActiveFacilityTypes({ ...activeFacilityTypes, polyclinic: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span>Polyclinics (Primary Care)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={activeFacilityTypes.eldercare}
                  onChange={(e) => setActiveFacilityTypes({ ...activeFacilityTypes, eldercare: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Active Ageing Centres (AAC)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={activeFacilityTypes.nursing_home}
                  onChange={(e) => setActiveFacilityTypes({ ...activeFacilityTypes, nursing_home: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-0"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Nursing Homes</span>
              </label>
            </div>
          </div>
        )}

        {/* Dynamic Legend Indicator on Bottom-Right */}
        <div className="absolute bottom-6 right-4 z-[1000] bg-slate-900/95 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-300 shadow-2xl backdrop-blur-md hidden sm:flex flex-col gap-1.5">
          <div className="font-semibold text-slate-200 flex items-center justify-between gap-4">
            <span>{activeOverlay} Legend</span>
            <span className="text-[10px] font-mono text-teal-400">OneMap GIS</span>
          </div>

          {activeOverlay === 'Healthcare Facility Density' && (
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>&lt;3.0 / 10k (Deficit)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>3.0–4.0 (Moderate)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>4.0–6.0 (Good)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>&gt;6.0 (High Hub)</span>
              </div>
            </div>
          )}

          {activeOverlay === 'Elderly Population Heatmap' && (
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-700"></span>
                <span>&gt;3,200 seniors/km² (Severe)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>2,400–3,200 (High)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>1,800–2,400 (Moderate)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>&lt;1,800 (Lower)</span>
              </div>
            </div>
          )}

          {activeOverlay === 'Public Transport Accessibility' && (
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-900 border border-teal-400 text-teal-400 text-[8px] flex items-center justify-center font-bold">MRT</span>
                <span>Transit Hubs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-teal-400 border-dashed bg-teal-500/20"></span>
                <span>400m Direct Walk (5m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-dashed bg-cyan-500/10"></span>
                <span>800m Transit Feeder (15m)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Contextual Inspector & OneMap Route Planner */}
      <aside className="w-96 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full overflow-y-auto">
        {/* Route Details Panel if active */}
        {activeRoute && (
          <div className="p-4 border-b border-teal-500/30 bg-teal-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
                <Navigation className="w-3.5 h-3.5" />
                OneMap Route Active
              </div>
              <button
                onClick={clearRoute}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-sm font-semibold text-white">
              {activeRoute.destinationName}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">Distance</div>
                <div className="font-mono text-base font-bold text-teal-300">
                  {(activeRoute.route_summary.total_distance / 1000).toFixed(2)} km
                </div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">Elderly Walking Time</div>
                <div className="font-mono text-base font-bold text-amber-300">
                  {Math.round(activeRoute.route_summary.total_time / 60)} mins
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 max-h-36 overflow-y-auto pr-1">
              <div className="font-medium text-slate-300 mb-1">Turn Instructions:</div>
              {activeRoute.route_instructions?.map((inst: any, idx: number) => (
                <div key={idx} className="flex items-start gap-1.5 py-0.5 border-b border-slate-800/40">
                  <span className="font-mono text-teal-400 text-[10px] mt-0.5">{idx + 1}.</span>
                  <span>{inst.instruction}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Facility Inspector */}
        {selectedFacility ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider uppercase font-mono text-teal-400">
                Facility Details
              </span>
              <button
                onClick={() => onSelectFacility(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Close
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{selectedFacility.name}</h2>
              <div className="text-xs text-teal-400 font-medium mt-0.5">{selectedFacility.typeLabel}</div>
              <div className="text-xs text-slate-400 mt-1">{selectedFacility.address}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Planning Area</div>
                <div className="font-semibold text-slate-200 mt-0.5">{selectedFacility.planningArea}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Capacity</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {selectedFacility.beds ? `${selectedFacility.beds} Inpatient Beds` : 'Outpatient Primary'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="text-slate-400 text-[11px] font-medium">Services & Specialized Care:</div>
              <div className="flex flex-wrap gap-1">
                {selectedFacility.services.map((svc, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                    {svc}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div><span className="text-slate-400">Hours:</span> {selectedFacility.operatingHours}</div>
              <div><span className="text-slate-400">Contact:</span> <span className="font-mono">{selectedFacility.contact}</span></div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleRouteToFacility(selectedFacility)}
                disabled={isRouting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors shadow-md shadow-teal-500/20"
              >
                <Footprints className="w-4 h-4" />
                {isRouting ? 'Calculating OneMap Path...' : 'Simulate Elderly Walk Route'}
              </button>

              <a
                href={`https://www.onemap.gov.sg/main/v2/?lat=${selectedFacility.coordinates[0]}&lng=${selectedFacility.coordinates[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-lg border border-slate-800 transition-colors"
              >
                <span>View Location on OneMap SLA</span>
                <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              </a>
            </div>
          </div>
        ) : selectedArea ? (
          /* Selected Planning Area Inspector */
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider uppercase font-mono text-teal-400">
                Planning Area Profile
              </span>
              <button
                onClick={() => onSelectArea(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Clear Selection
              </button>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{selectedArea.name}</h2>
                <span className="text-xs text-slate-400">({selectedArea.region} Region)</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                SingStat Master Plan 2024–2025 Demographics
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">Seniors (65+)</div>
                <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                  {selectedArea.seniorPopulation.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">{selectedArea.agingPercentage}% of residents</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">Senior Density</div>
                <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                  {selectedArea.seniorDensityPerSqKm.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">Seniors / km²</div>
              </div>
            </div>

            {/* Healthcare Density Scorecard */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Healthcare Capacity Ratio</span>
                <span className="font-mono text-teal-400 font-bold">{selectedArea.facilitiesPer10kSeniors.toFixed(1)} / 10k</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-teal-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (selectedArea.facilitiesPer10kSeniors / 8) * 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>National Avg: 3.8 / 10k</span>
                <span className="text-teal-300 font-semibold">Grade: {selectedArea.accessibilityGrade}</span>
              </div>
            </div>

            {/* Public Transport Connectivity Insight */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-cyan-400" />
                  Transit Accessibility:
                </span>
                <span className="font-mono text-cyan-300 font-bold">{selectedArea.pctWithin15MinWalk}% Coverage</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedArea.pctWithin15MinWalk >= 85
                  ? 'Excellent connectivity: vast majority of senior blocks connect directly via sheltered walkways to primary clinics or MRT bus feeders.'
                  : 'Transit deficit zone: elderly residents in fringe subzones require extended feeder journeys to reach polyclinic hubs.'}
              </p>
            </div>

            {/* Facilities in this planning area */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Facilities in {selectedArea.name}</span>
                <span className="text-[10px] font-mono text-slate-400">{selectedArea.totalHealthcareFacilities} Total</span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {facilities.filter(f => f.planningArea.toLowerCase().includes(selectedArea.name.toLowerCase())).map(f => (
                  <div
                    key={f.id}
                    onClick={() => onSelectFacility(f)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 cursor-pointer border border-slate-800/80 transition-colors text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-white">{f.name}</div>
                      <div className="text-[10px] text-slate-400">{f.typeLabel}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRouteToFacility(f);
                      }}
                      className="p-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300"
                      title="Route from area centre"
                    >
                      <Navigation className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <a
                href={`https://www.onemap.gov.sg/main/v2/?lat=${selectedArea.coordinates[0]}&lng=${selectedArea.coordinates[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-lg border border-slate-800 transition-colors mt-2"
              >
                <span>View Town on OneMap SLA</span>
                <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              </a>
            </div>
          </div>
        ) : (
          /* Default Overview Prompt */
          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">Singapore Spatial Overview</h2>
              <div className="text-xs text-slate-400 mt-1">
                Use the top layer control to switch between <strong>Healthcare Facility Density</strong>, <strong>Elderly Population Heatmap</strong>, and <strong>Public Transport Accessibility</strong>. Click any planning area circle on the map to inspect town metrics.
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-teal-400 font-semibold">
                <Info className="w-4 h-4" />
                <span>Active Overlay Analysis</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeOverlay === 'Healthcare Facility Density' && 'Visualizing the geographic density and catchment buffers of 20+ primary polyclinics, acute hospitals, and senior care centres across Singapore.'}
                {activeOverlay === 'Elderly Population Heatmap' && 'Highlighting high-density senior citizen concentrations across mature estates (Toa Payoh, Bedok, Ang Mo Kio, Bukit Merah, Queenstown).'}
                {activeOverlay === 'Public Transport Accessibility' && 'Visualizing the 400m direct walk and 800m feeder transit isochrones connecting MRT & bus interchanges to public health facilities.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Highest Senior Density Towns</div>
              {planningAreas
                .slice()
                .sort((a, b) => b.seniorDensityPerSqKm - a.seniorDensityPerSqKm)
                .slice(0, 5)
                .map(pa => (
                  <div
                    key={pa.id}
                    onClick={() => onSelectArea(pa)}
                    className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 cursor-pointer border border-slate-800 text-xs flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">{pa.name}</div>
                      <div className="text-[10px] text-slate-400">{pa.agingPercentage}% 65+ ({pa.seniorPopulation.toLocaleString()})</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-amber-300 font-bold">{pa.seniorDensityPerSqKm}</div>
                      <div className="text-[9px] text-slate-400">seniors / km²</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
