import React from 'react';
import { MapPin, BarChart3, Database, Compass, FileText, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: 'map' | 'analytics' | 'singstat' | 'onemap' | 'simulator';
  setActiveTab: (tab: 'map' | 'analytics' | 'singstat' | 'onemap' | 'simulator') => void;
  onOpenReport: () => void;
  onOpenHealth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenReport, onOpenHealth }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <Activity className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          SG HealthAge
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'map'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Geospatial Map
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Density Analytics
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Policy Simulator
        </button>

        <button
          onClick={() => setActiveTab('singstat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'singstat'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          SingStat TableBuilder
        </button>

        <button
          onClick={() => setActiveTab('onemap')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'onemap'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          OneMap Lab
        </button>
      </nav>

      {/* Zone 3: Actions & Diagnostics */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onOpenHealth && (
          <button
            onClick={onOpenHealth}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
            title="Check SingStat, OneMap, and LTA DataMall API Health"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">API Health</span>
          </button>
        )}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-all shadow-sm shadow-teal-500/20 whitespace-nowrap shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          Project Synthesis
        </button>
      </div>
    </header>
  );
};
