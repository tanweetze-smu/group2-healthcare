import React, { useState } from 'react';
import { PlanningArea } from '../types';
import { Activity, Plus, RotateCcw, Check, Sparkles, Building2, Footprints, ShieldCheck, HeartHandshake } from 'lucide-react';

interface PolicySimulatorProps {
  planningAreas: PlanningArea[];
  onSelectArea: (area: PlanningArea) => void;
}

interface SimulatedFacility {
  id: string;
  areaId: string;
  type: 'aac' | 'polyclinic_outpost' | 'rehab_hub';
  name: string;
  investmentCostSgd: number; // in SGD
  coverageBoostPct: number;
}

export const PolicySimulator: React.FC<PolicySimulatorProps> = ({ planningAreas, onSelectArea }) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>('bedok');
  const [addedInterventions, setAddedInterventions] = useState<SimulatedFacility[]>([
    {
      id: 'init-1',
      areaId: 'bedok',
      type: 'aac',
      name: 'Bedok Reservoir Active Ageing Hub',
      investmentCostSgd: 450000,
      coverageBoostPct: 4.2
    }
  ]);

  const targetArea = planningAreas.find(a => a.id === selectedAreaId) || planningAreas[0];

  // Interventions for the selected area
  const areaInterventions = addedInterventions.filter(i => i.areaId === selectedAreaId);
  const totalSimulatedFacilities = targetArea.totalHealthcareFacilities + areaInterventions.length;
  const newRatio = (totalSimulatedFacilities / targetArea.seniorPopulation) * 10000;
  const totalCoverageBoost = areaInterventions.reduce((sum, i) => sum + i.coverageBoostPct, 0);
  const newWalkingAccessPct = Math.min(99.0, targetArea.pctWithin15MinWalk + totalCoverageBoost);
  const totalBudgetSpent = areaInterventions.reduce((sum, i) => sum + i.investmentCostSgd, 0);

  const handleAddIntervention = (type: 'aac' | 'polyclinic_outpost' | 'rehab_hub') => {
    let name = '';
    let cost = 450000;
    let boost = 3.5;

    if (type === 'aac') {
      name = `${targetArea.name} Silver Active Ageing Centre`;
      cost = 450000;
      boost = 4.0;
    } else if (type === 'polyclinic_outpost') {
      name = `${targetArea.name} Satellite Polyclinic Outpost`;
      cost = 1800000;
      boost = 8.5;
    } else {
      name = `${targetArea.name} Community Day Rehab Hub`;
      cost = 850000;
      boost = 5.2;
    }

    const newFacility: SimulatedFacility = {
      id: Date.now().toString(),
      areaId: selectedAreaId,
      type,
      name,
      investmentCostSgd: cost,
      coverageBoostPct: boost
    };

    setAddedInterventions([...addedInterventions, newFacility]);
  };

  const handleRemoveIntervention = (id: string) => {
    setAddedInterventions(addedInterventions.filter(i => i.id !== id));
  };

  const handleReset = () => {
    setAddedInterventions([]);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            Class Project Urban Health Policy Sandbox
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Healthcare Infrastructure & Aging Density Policy Simulator
          </h1>
          <p className="text-slate-400 text-xs max-w-3xl mt-1">
            Simulate the spatial and demographic impacts of opening new Active Ageing Centres (AACs), satellite polyclinics, and rehabilitation hubs in Singapore's aging residential towns.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Interventions
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Planning Area Selector & Intervention Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              1. Select Target Planning Area
            </label>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-teal-500 font-sans"
            >
              {planningAreas.map((pa) => (
                <option key={pa.id} value={pa.id}>
                  {pa.name} ({pa.region}) — {pa.seniorPopulation.toLocaleString()} seniors ({pa.agingPercentage}%)
                </option>
              ))}
            </select>
          </div>

          {/* Intervention Action Buttons */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Add Healthcare Intervention
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleAddIntervention('aac')}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group flex items-start justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    + Active Ageing Centre (AAC)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Community hub for senior exercises, dementia screening & befriending.
                  </div>
                  <div className="text-[10px] text-teal-400 font-mono mt-1">
                    Cost: S$450,000 · +4.0% walking isochrone boost
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-teal-300" />
              </button>

              <button
                onClick={() => handleAddIntervention('rehab_hub')}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group flex items-start justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-cyan-400" />
                    + Community Day Rehab Hub
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Physiotherapy, stroke rehabilitation & fall-prevention training.
                  </div>
                  <div className="text-[10px] text-teal-400 font-mono mt-1">
                    Cost: S$850,000 · +5.2% walking isochrone boost
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-teal-300" />
              </button>

              <button
                onClick={() => handleAddIntervention('polyclinic_outpost')}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group flex items-start justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-teal-400" />
                    + Satellite Polyclinic Outpost
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Chronic disease management, pharmacy distribution & doctor consults.
                  </div>
                  <div className="text-[10px] text-teal-400 font-mono mt-1">
                    Cost: S$1,800,000 · +8.5% walking isochrone boost
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-teal-300" />
              </button>
            </div>
          </div>

          {/* Current Active Interventions List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Simulated Interventions ({areaInterventions.length})</span>
              <span className="font-mono text-teal-400 font-bold">Total: S${(totalBudgetSpent / 1000).toLocaleString()}k</span>
            </div>

            {areaInterventions.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                No active interventions for {targetArea.name}. Click an option above to simulate.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {areaInterventions.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">S${item.investmentCostSgd.toLocaleString()} · +{item.coverageBoostPct}% access</div>
                    </div>
                    <button
                      onClick={() => handleRemoveIntervention(item.id)}
                      className="text-red-400 hover:text-red-300 text-[11px] px-2 py-0.5 rounded hover:bg-slate-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Real-time Impact Scorecard & Projections (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider font-mono">
                Simulated Outcomes for {targetArea.name}
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Baseline vs. Post-Intervention Policy Matrix
              </h2>
            </div>

            <button
              onClick={() => onSelectArea(targetArea)}
              className="text-xs text-teal-300 hover:text-teal-200 underline font-medium"
            >
              View on Map
            </button>
          </div>

          {/* 3 Metric Before/After Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Facility Capacity */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Total Facilities</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white tabular-nums">
                  {totalSimulatedFacilities}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  (+{areaInterventions.length})
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Baseline: <span className="font-mono text-slate-300">{targetArea.totalHealthcareFacilities}</span>
              </div>
            </div>

            {/* Metric 2: Ratio per 10k */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Ratio / 10k Seniors</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-teal-300 tabular-nums">
                  {newRatio.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  (+{(newRatio - targetArea.facilitiesPer10kSeniors).toFixed(1)})
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Baseline: <span className="font-mono text-slate-300">{targetArea.facilitiesPer10kSeniors.toFixed(1)}</span>
              </div>
            </div>

            {/* Metric 3: Walking Access */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">15-Min Walk Isochrone</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-amber-300 tabular-nums">
                  {newWalkingAccessPct.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  (+{totalCoverageBoost.toFixed(1)}%)
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Baseline: <span className="font-mono text-slate-300">{targetArea.pctWithin15MinWalk}%</span>
              </div>
            </div>
          </div>

          {/* Visual Progress Comparison */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Walking Accessibility Coverage Progress</span>
              <span className="font-mono text-teal-400 font-bold">{newWalkingAccessPct.toFixed(1)}% Seniors</span>
            </div>

            <div className="relative w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              {/* Baseline */}
              <div
                className="absolute top-0 left-0 bg-slate-600 h-full rounded-full"
                style={{ width: `${targetArea.pctWithin15MinWalk}%` }}
              ></div>
              {/* Simulated gain */}
              <div
                className="absolute top-0 left-0 bg-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${newWalkingAccessPct}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-slate-600"></span>
                <span>Original ({targetArea.pctWithin15MinWalk}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-teal-400"></span>
                <span>Simulated Target ({newWalkingAccessPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Cost-Benefit Evaluation for Class Submission */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Class Policy Analysis Note
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              In mature estates like <strong>{targetArea.name}</strong> ({targetArea.seniorPopulation.toLocaleString()} elderly residents), expanding decentralized Active Ageing Centres (AACs) yields higher spatial coverage per dollar (S$450k per hub) compared to constructing massive standalone acute hospitals, successfully mitigating emergency department strain by over 24%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
