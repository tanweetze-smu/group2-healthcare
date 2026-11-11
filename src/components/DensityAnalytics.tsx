import React, { useState } from 'react';
import { PlanningArea } from '../types';
import { AGING_TREND_YEARS } from '../data/singaporeData';
import { BarChart3, TrendingUp, Users, HeartPulse, ShieldAlert, ArrowUpDown, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface DensityAnalyticsProps {
  planningAreas: PlanningArea[];
  onSelectArea: (area: PlanningArea) => void;
}

export const DensityAnalytics: React.FC<DensityAnalyticsProps> = ({ planningAreas, onSelectArea }) => {
  const [sortField, setSortField] = useState<keyof PlanningArea>('seniorPopulation');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [regionFilter, setRegionFilter] = useState<string>('All');

  const totalSeniors = planningAreas.reduce((sum, a) => sum + a.seniorPopulation, 0);
  const totalPop = planningAreas.reduce((sum, a) => sum + a.totalPopulation, 0);
  const nationalAgingPct = ((totalSeniors / totalPop) * 100).toFixed(1);

  const filteredAreas = planningAreas
    .filter(a => regionFilter === 'All' || a.region === regionFilter)
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  const handleSort = (field: keyof PlanningArea) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  // Generate SVG Points for Aging Trend Line
  const maxPct = 26;
  const minPct = 10;
  const years = AGING_TREND_YEARS;
  const xScale = (idx: number) => padding.left + (idx / (years.length - 1)) * (chartWidth - padding.left - padding.right);
  const yScale = (pct: number) => chartHeight - padding.bottom - ((pct - minPct) / (maxPct - minPct)) * (chartHeight - padding.top - padding.bottom);

  const pointsString = years.map((d, i) => `${xScale(i)},${yScale(d.pctAged65Plus)}`).join(' ');
  const areaString = `${xScale(0)},${chartHeight - padding.bottom} ${pointsString} ${xScale(years.length - 1)},${chartHeight - padding.bottom}`;

  // Super-aged threshold 21% line
  const thresholdY = yScale(21.0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" />
          Demographic & Healthcare Geospatial Analytics
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
          Healthcare Density & Demographic Aging Diagnostics
        </h1>
        <p className="text-slate-400 text-xs max-w-3xl mt-1">
          Evaluating geographic distribution, eldercare infrastructure saturation, and walking accessibility across Singapore's residential planning areas.
        </p>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Resident Seniors (65+)</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {totalSeniors.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-400 font-medium flex items-center gap-1">
            <span>{nationalAgingPct}% of total population</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">SingStat 2025</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Old-Age Support Ratio</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            3.1 : 1
          </div>
          <div className="text-[11px] text-slate-400">
            Down from <span className="font-mono text-slate-300">5.7 : 1</span> in 2014
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Healthcare Capacity Ratio</span>
            <HeartPulse className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300 tabular-nums">
            3.8 / 10k
          </div>
          <div className="text-[11px] text-slate-400">
            Polyclinics & AACs per 10k elderly
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>15-Min Walk Isochrone</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">
            78.6%
          </div>
          <div className="text-[11px] text-slate-400">
            Seniors within 800m of care
          </div>
        </div>
      </div>

      {/* Visual Charts Grid: Aging Curve & Regional Isochrone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: SingStat Longitudinal Aging Trend (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider font-mono">
                SingStat M810001 & M810011 Longitudinal Analysis
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Singapore Aging Population Progression (2014–2030)
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-teal-400"></span>
                <span>% Seniors (65+)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-400 border-dashed"></span>
                <span className="text-red-300">21% Super-Aged Benchmark</span>
              </span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 select-none font-sans">
              <defs>
                <linearGradient id="agingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[12, 16, 20, 24].map((gridVal) => {
                const y = yScale(gridVal);
                return (
                  <g key={gridVal}>
                    <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#334155" strokeDasharray="3 3" opacity="0.6" />
                    <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10" className="font-mono">
                      {gridVal}%
                    </text>
                  </g>
                );
              })}

              {/* Super-Aged 21% Threshold Line */}
              <line
                x1={padding.left}
                y1={thresholdY}
                x2={chartWidth - padding.right}
                y2={thresholdY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x={chartWidth - padding.right - 5} y={thresholdY - 6} textAnchor="end" fill="#f87171" fontSize="10" fontWeight="600">
                WHO Super-Aged Threshold (21%)
              </text>

              {/* Area Fill */}
              <polygon points={areaString} fill="url(#agingGradient)" />

              {/* Line */}
              <polyline points={pointsString} fill="none" stroke="#14b8a6" strokeWidth="2.5" />

              {/* Data Points */}
              {years.map((d, i) => {
                const x = xScale(i);
                const y = yScale(d.pctAged65Plus);
                return (
                  <g key={d.year}>
                    <circle cx={x} cy={y} r="4" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
                    <text x={x} y={chartHeight - 12} textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-mono">
                      {d.year}
                    </text>
                    <text x={x} y={y - 8} textAnchor="middle" fill="#f1f5f9" fontSize="10" fontWeight="bold" className="font-mono">
                      {d.pctAged65Plus}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
            <span className="font-semibold text-teal-300">Policy Takeaway:</span> Singapore crosses the United Nations threshold into a <em>"Super-Aged Society"</em> (~21% aged 65+) around 2026. This elevates community-based primary healthcare (Polyclinics and Active Ageing Hubs) as the cornerstone of preventative eldercare.
          </div>
        </div>

        {/* Right: Regional Comparison (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div>
            <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider font-mono">
              Regional Accessibility
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
              15-Min Walk Isochrone by Region
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { region: 'Central', pct: 90.1, areas: 'Toa Payoh, Bukit Merah, Queenstown, Outram', grade: 'A+' },
              { region: 'East', pct: 79.2, areas: 'Bedok, Tampines, Pasir Ris, Marine Parade', grade: 'B+' },
              { region: 'West', pct: 75.6, areas: 'Jurong West, Clementi, Bukit Batok', grade: 'B' },
              { region: 'North', pct: 73.9, areas: 'Woodlands, Yishun', grade: 'B-' },
              { region: 'North-East', pct: 73.1, areas: 'Ang Mo Kio, Hougang, Serangoon, Sengkang', grade: 'B-' }
            ].map((reg) => (
              <div key={reg.region} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{reg.region} Region</span>
                  <span className="font-mono font-bold text-teal-400">{reg.pct}% within 800m</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-teal-400 h-1.5 rounded-full"
                    style={{ width: `${reg.pct}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="truncate max-w-[200px]">{reg.areas}</span>
                  <span className="text-teal-300 font-mono font-semibold">Grade {reg.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planning Areas Comparison Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Singapore Planning Area Healthcare Density Index
            </h2>
            <div className="text-xs text-slate-400">
              Click any column header to sort, or filter by region. Click any row to jump to its map inspection.
            </div>
          </div>

          {/* Region Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {['All', 'Central', 'East', 'West', 'North', 'North-East'].map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  regionFilter === r ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-800 select-none">
              <tr>
                <th onClick={() => handleSort('name')} className="py-3 px-4 font-semibold cursor-pointer hover:text-teal-400">
                  <div className="flex items-center gap-1">Planning Area <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('region')} className="py-3 px-4 font-semibold cursor-pointer hover:text-teal-400">
                  Region
                </th>
                <th onClick={() => handleSort('seniorPopulation')} className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400">
                  <div className="flex items-center justify-end gap-1">Seniors (65+) <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('agingPercentage')} className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400">
                  <div className="flex items-center justify-end gap-1">Aging % <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('seniorDensityPerSqKm')} className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400">
                  <div className="flex items-center justify-end gap-1">Density (/km²) <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('totalHealthcareFacilities')} className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400">
                  <div className="flex items-center justify-end gap-1">Total Facilities <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('facilitiesPer10kSeniors')} className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400">
                  <div className="flex items-center justify-end gap-1">Ratio / 10k <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('pctWithin15MinWalk')} className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400">
                  <div className="flex items-center justify-end gap-1">15-Min Walk % <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredAreas.map((pa) => (
                <tr
                  key={pa.id}
                  onClick={() => onSelectArea(pa)}
                  className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 font-medium text-white flex items-center gap-1.5">
                    <span>{pa.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{pa.region}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-teal-300 font-semibold">
                    {pa.seniorPopulation.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {pa.agingPercentage}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-300">
                    {pa.seniorDensityPerSqKm.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {pa.totalHealthcareFacilities}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-teal-400">
                    {pa.facilitiesPer10kSeniors.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {pa.pctWithin15MinWalk}%
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                      pa.accessibilityGrade === 'A+' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      pa.accessibilityGrade === 'A' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                      pa.accessibilityGrade === 'B' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      pa.accessibilityGrade === 'C' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {pa.accessibilityGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
