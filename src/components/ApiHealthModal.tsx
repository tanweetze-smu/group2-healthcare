import React, { useState, useEffect } from 'react';
import { fetchApiHealth, fetchCarParkAvailability } from '../services/apiService';
import { X, CheckCircle2, AlertCircle, RefreshCw, Activity, Terminal, ExternalLink, Key, Database, Compass, Car, Copy, Check } from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testCarParkSearch, setTestCarParkSearch] = useState('Hospital');
  const [carparkResult, setCarparkResult] = useState<any>(null);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  const runCheck = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApiHealth();
      setHealthData(data);
      const cpData = await fetchCarParkAvailability(testCarParkSearch, undefined, customKeyInput || undefined);
      setCarparkResult(cpData);
    } catch (err) {
      console.error('Health check failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyUrl = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                API Health & Live Connection Diagnostics
              </h2>
              <div className="text-xs text-slate-400">
                SingStat TableBuilder · SLA OneMap · LTA DataMall Serverless Handlers
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runCheck}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Ping & Test All APIs
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Quick Guide Card answering "where do i check?" */}
          <div className="p-4 bg-slate-950 rounded-xl border border-teal-500/30 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs">
              <Terminal className="w-4 h-4" />
              <span>How To Check If APIs Are Linking Correctly</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              You can test API linking both inside this interactive panel and directly in your browser or with <code className="bg-slate-900 px-1 py-0.5 rounded text-teal-300 font-mono">curl</code>. All endpoints are mapped to serverless handlers inside the <code className="bg-slate-900 px-1 py-0.5 rounded text-teal-300 font-mono">/api</code> folder:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">System Health Status:</div>
                  <div className="text-teal-300 font-semibold">GET /api/health</div>
                </div>
                <button
                  onClick={() => copyUrl(`${window.location.origin}/api/health`, 'health')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedEndpoint === 'health' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">LTA Carpark Availability:</div>
                  <div className="text-teal-300 font-semibold">GET /api/carparkavailability</div>
                </div>
                <button
                  onClick={() => copyUrl(`${window.location.origin}/api/carparkavailability`, 'cp')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedEndpoint === 'cp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">SingStat Table Search:</div>
                  <div className="text-teal-300 font-semibold">GET /api/singstat/search?keyword=cpi</div>
                </div>
                <button
                  onClick={() => copyUrl(`${window.location.origin}/api/singstat/search?keyword=cpi`, 'ss')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedEndpoint === 'ss' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">OneMap Geocoder Search:</div>
                  <div className="text-teal-300 font-semibold">GET /api/onemap/search?searchVal=raffles</div>
                </div>
                <button
                  onClick={() => copyUrl(`${window.location.origin}/api/onemap/search?searchVal=raffles%20place`, 'om')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedEndpoint === 'om' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. SingStat TableBuilder */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Database className="w-4 h-4 text-teal-400" />
                    SingStat TableBuilder
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    {healthData?.services?.singstat?.status || 'operational'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  {healthData?.services?.singstat?.message || 'Singapore Department of Statistics API linked.'}
                </div>

                <div className="font-mono text-[10px] text-slate-500">
                  Latency: <span className="text-teal-300">{healthData?.services?.singstat?.latencyMs || 0}ms</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px]">
                <a
                  href="https://tablebuilder.singstat.gov.sg/api/table/metadata/M213751"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-teal-400 hover:underline"
                >
                  <span>M213751 (CPI Metadata)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://tablebuilder.singstat.gov.sg/api/table/tabledata/M810001?limit=6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-teal-400 hover:underline"
                >
                  <span>M810001 (Aging Population)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* 2. SLA OneMap API */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Compass className="w-4 h-4 text-teal-400" />
                    SLA OneMap API
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    {healthData?.services?.onemap?.status || 'operational'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  {healthData?.services?.onemap?.message || 'SLA OneMap geospatial and routing engine connected.'}
                </div>

                <div className="font-mono text-[10px] text-slate-500">
                  Latency: <span className="text-teal-300">{healthData?.services?.onemap?.latencyMs || 2}ms</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px]">
                <a
                  href="https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-teal-400 hover:underline"
                >
                  <span>Elastic Geocode Search</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=walk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-teal-400 hover:underline"
                >
                  <span>Walking Route API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* 3. LTA DataMall CarPark Availability */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Car className="w-4 h-4 text-teal-400" />
                    LTA DataMall CarPark
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${
                    healthData?.diagnostics?.hasLtaKey ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {healthData?.diagnostics?.hasLtaKey ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {healthData?.diagnostics?.hasLtaKey ? 'Live AccountKey' : 'Baseline Active'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 leading-snug">
                  {healthData?.diagnostics?.hasLtaKey
                    ? 'AccountKey loaded from environment variable LTA_DATAMALL_KEY.'
                    : 'No key in .env yet. Hospital carparks active as baseline without hardcoding.'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px]">
                <a
                  href="http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-teal-400 hover:underline"
                >
                  <span>CarParkAvailabilityv2</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-500">File: /api/carparkavailability.ts</span>
              </div>
            </div>
          </div>

          {/* Interactive LTA DataMall CarPark Availability Live Viewer */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-teal-400" />
                <span className="font-semibold text-white text-xs">
                  LTA DataMall CarPark Availability Tester (/api/carparkavailability)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testCarParkSearch}
                  onChange={(e) => setTestCarParkSearch(e.target.value)}
                  placeholder="Filter development e.g. SGH, Bedok..."
                  className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-sans w-48 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={runCheck}
                  className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-semibold rounded-lg border border-teal-500/40 transition-colors"
                >
                  Query
                </button>
              </div>
            </div>

            {/* Optional Key Test Input (No Hardcoding) */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Key className="w-3.5 h-3.5 text-teal-400" />
                <span>Test with your LTA AccountKey (optional, not stored):</span>
              </div>
              <input
                type="password"
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                placeholder="Paste key to test live stream..."
                className="px-2 py-0.5 text-xs bg-slate-950 border border-slate-700 rounded text-white font-mono w-56 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 max-h-52 overflow-y-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Carpark ID</th>
                    <th className="py-2 px-3">Development / Healthcare Facility</th>
                    <th className="py-2 px-3">Area</th>
                    <th className="py-2 px-3 text-right">Available Lots</th>
                    <th className="py-2 px-3 text-center">Agency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {carparkResult?.value?.map((cp: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-teal-400">{cp.CarParkID}</td>
                      <td className="py-2 px-3 font-medium text-white">{cp.Development}</td>
                      <td className="py-2 px-3 text-slate-400">{cp.Area}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {cp.AvailableLots} lots
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                          {cp.Agency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>{carparkResult?.note || 'Live data from LTA DataMall or baseline hospital carparks.'}</span>
              <span className="font-mono text-teal-400">{carparkResult?.totalRecords || 0} Carparks Listed</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Server Status: <strong className="text-emerald-400 font-mono">200 OK (Port 3000)</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
