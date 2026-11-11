/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { DensityAnalytics } from './components/DensityAnalytics';
import { PolicySimulator } from './components/PolicySimulator';
import { SingStatExplorer } from './components/SingStatExplorer';
import { OneMapLab } from './components/OneMapLab';
import { ReportModal } from './components/ReportModal';
import { ApiHealthModal } from './components/ApiHealthModal';
import { fetchHealthcareDensity } from './services/apiService';
import { PlanningArea, HealthcareFacility } from './types';
import { SINGAPORE_PLANNING_AREAS, HEALTHCARE_FACILITIES } from './data/singaporeData';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'simulator' | 'singstat' | 'onemap'>('map');
  const [planningAreas, setPlanningAreas] = useState<PlanningArea[]>(SINGAPORE_PLANNING_AREAS);
  const [facilities, setFacilities] = useState<HealthcareFacility[]>(HEALTHCARE_FACILITIES);
  const [selectedArea, setSelectedArea] = useState<PlanningArea | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchHealthcareDensity();
        if (data.planningAreas && data.planningAreas.length > 0) {
          setPlanningAreas(data.planningAreas);
        }
        if (data.facilities && data.facilities.length > 0) {
          setFacilities(data.facilities);
        }
      } catch (err) {
        console.error('Using local fallback dataset:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectAreaAndSwitchToMap = (area: PlanningArea) => {
    setSelectedArea(area);
    setSelectedFacility(null);
    setActiveTab('map');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        <div className="text-sm font-semibold text-white tracking-wide">
          Initializing SG HealthAge Analytics & GIS Engine...
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Connecting to SingStat TableBuilder & OneMap REST endpoints
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      {/* 3-Zone Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'map' && (
          <MapView
            planningAreas={planningAreas}
            facilities={facilities}
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
            selectedFacility={selectedFacility}
            onSelectFacility={setSelectedFacility}
          />
        )}

        {activeTab === 'analytics' && (
          <DensityAnalytics
            planningAreas={planningAreas}
            onSelectArea={handleSelectAreaAndSwitchToMap}
          />
        )}

        {activeTab === 'simulator' && (
          <PolicySimulator
            planningAreas={planningAreas}
            onSelectArea={handleSelectAreaAndSwitchToMap}
          />
        )}

        {activeTab === 'singstat' && (
          <SingStatExplorer />
        )}

        {activeTab === 'onemap' && (
          <OneMapLab />
        )}
      </main>

      {/* Class Project Synthesis Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        planningAreas={planningAreas}
        facilities={facilities}
      />

      {/* API Health & Live Diagnostics Modal */}
      <ApiHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />
    </div>
  );
}
