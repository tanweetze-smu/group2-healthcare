import React, { useState } from 'react';
import { mintOneMapToken, searchOneMap, reverseGeocodeOneMap, calculateOneMapRoute } from '../services/apiService';
import { Compass, Key, Search, MapPin, Navigation, Play, CheckCircle2, Clock, Terminal, Copy, Check, ExternalLink } from 'lucide-react';

export const OneMapLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'token' | 'search' | 'revgeocode' | 'routing'>('token');

  // 1. Token state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenResponse, setTokenResponse] = useState<any>(null);
  const [isMintingToken, setIsMintingToken] = useState(false);

  // 2. Search / Geocode state
  const [searchVal, setSearchVal] = useState('raffles place');
  const [searchResponse, setSearchResponse] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 3. Reverse Geocode state
  const [revLat, setRevLat] = useState('1.320981');
  const [revLng, setRevLng] = useState('103.844150');
  const [revBuffer, setRevBuffer] = useState('40');
  const [revResponse, setRevResponse] = useState<any>(null);
  const [isRevGeocoding, setIsRevGeocoding] = useState(false);

  // 4. Routing state
  const [routeStart, setRouteStart] = useState('1.320981,103.844150'); // Tan Tock Seng area
  const [routeEnd, setRouteEnd] = useState('1.326762,103.855900'); // Toa Payoh
  const [routeType, setRouteType] = useState<'walk' | 'drive' | 'cycle' | 'pt'>('walk');
  const [routeResponse, setRouteResponse] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handlers
  const handleMintToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMintingToken(true);
    try {
      const res = await mintOneMapToken(email || undefined, password || undefined);
      setTokenResponse(res);
    } catch (err: any) {
      setTokenResponse({ error: err.message });
    } finally {
      setIsMintingToken(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const res = await searchOneMap(searchVal);
      setSearchResponse(res);
    } catch (err: any) {
      setSearchResponse({ error: err.message });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRevGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRevGeocoding(true);
    try {
      const res = await reverseGeocodeOneMap(parseFloat(revLat), parseFloat(revLng));
      setRevResponse(res);
    } catch (err: any) {
      setRevResponse({ error: err.message });
    } finally {
      setIsRevGeocoding(false);
    }
  };

  const handleRouting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculatingRoute(true);
    try {
      const [startLat, startLng] = routeStart.split(',').map(Number);
      const [endLat, endLng] = routeEnd.split(',').map(Number);
      const res = await calculateOneMapRoute([startLat, startLng], [endLat, endLng], routeType);
      setRouteResponse(res);
    } catch (err: any) {
      setRouteResponse({ error: err.message });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            Singapore Land Authority (SLA) OneMap API Laboratory
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            OneMap Geospatial & Routing API Sandbox
          </h1>
          <p className="text-slate-400 text-xs max-w-3xl mt-1">
            Test and verify the 4 official OneMap REST endpoints required by the class project: Token Authentication, Elastic Geocoder Search, Reverse Geocoding, and Multimodal Routing (Walking, Transit, Driving, Cycling).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="https://www.onemap.gov.sg/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold rounded-xl border border-teal-500/30 transition-colors whitespace-nowrap"
          >
            <span>Open onemap.gov.sg</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* 4 Tool Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('token')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'token' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              1. Token Minting
            </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'search' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            2. Geocode / Search
          </button>

          <button
            onClick={() => setActiveTab('revgeocode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'revgeocode' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            3. Reverse Geocode
          </button>

          <button
            onClick={() => setActiveTab('routing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'routing' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            4. Routing Service
          </button>
        </div>
      </div>
    </div>

      {/* Main Sandbox Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          {activeTab === 'token' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider font-mono">
                  POST /api/auth/post/getToken
                </div>
                <h2 className="text-base font-bold text-white tracking-tight mt-1">
                  Mint a 3-Day OneMap Bearer Token
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  OneMap officially requires bearer authentication tokens for geocoding, reverse geocoding, and routing. Tokens expire after 72 hours (3 days).
                </p>
              </div>

              <form onSubmit={handleMintToken} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Registered OneMap Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com (or leave blank for sandbox token)"
                    className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">OneMap Account Password (Optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Testing Notes:</div>
                  <div>• If you enter valid OneMap SLA developer credentials, it mints a live token directly.</div>
                  <div>• If left blank, it provisions an instant authenticated sandbox session token for your class demo.</div>
                </div>

                <button
                  type="submit"
                  disabled={isMintingToken}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors shadow-md shadow-teal-500/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isMintingToken ? 'Minting Bearer Token...' : 'Mint OneMap Token'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider font-mono">
                  GET /api/common/elastic/search
                </div>
                <h2 className="text-base font-bold text-white tracking-tight mt-1">
                  OneMap Elastic Geocode Search
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Resolves Singapore postal codes, building names, street addresses, and polyclinics into SVY21 & WGS84 latitude/longitude coordinates.
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Search Query (searchVal)</label>
                  <input
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="e.g. raffles place, bedok polyclinic, sgh..."
                    className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400">Class Project Quick Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {['raffles place', 'heartbeat@bedok', 'tan tock seng', 'queenstown polyclinic', '169 Stirling Rd'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSearchVal(q)}
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-teal-500"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div>returnGeom: <span className="font-mono text-teal-400 font-bold">Y</span></div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div>getAddrDetails: <span className="font-mono text-teal-400 font-bold">Y</span></div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors shadow-md shadow-teal-500/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isSearching ? 'Executing Search...' : 'Execute Geocode Search'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'revgeocode' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider font-mono">
                  GET /api/public/revgeocode
                </div>
                <h2 className="text-base font-bold text-white tracking-tight mt-1">
                  OneMap Reverse Geocoding
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Queries Singapore Land Authority spatial index with GPS coordinates (lat, lng) within buffer radius to identify HDB blocks and road names.
                </p>
              </div>

              <form onSubmit={handleRevGeocode} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">Latitude</label>
                    <input
                      type="text"
                      value={revLat}
                      onChange={(e) => setRevLat(e.target.value)}
                      placeholder="1.320981"
                      className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">Longitude</label>
                    <input
                      type="text"
                      value={revLng}
                      onChange={(e) => setRevLng(e.target.value)}
                      placeholder="103.844150"
                      className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Buffer Radius (meters)</label>
                  <input
                    type="number"
                    value={revBuffer}
                    onChange={(e) => setRevBuffer(e.target.value)}
                    placeholder="40"
                    className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 font-mono"
                  />
                </div>

                {/* Coordinate Presets */}
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setRevLat('1.3268'); setRevLng('103.9318'); }}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-teal-500"
                  >
                    Bedok Polyclinic
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRevLat('1.3214'); setRevLng('103.8458'); }}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-teal-500"
                  >
                    Tan Tock Seng
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRevLat('1.3'); setRevLng('103.8'); }}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-teal-500"
                  >
                    Prompt Example (1.3, 103.8)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isRevGeocoding}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors shadow-md shadow-teal-500/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isRevGeocoding ? 'Reverse Geocoding...' : 'Execute Reverse Geocode'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider font-mono">
                  GET /api/public/routingsvc/route
                </div>
                <h2 className="text-base font-bold text-white tracking-tight mt-1">
                  Multimodal Healthcare Access Routing
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Generates point-to-point network routes across Singapore. Essential for measuring elderly walking time to primary polyclinics.
                </p>
              </div>

              <form onSubmit={handleRouting} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Start Point (lat,lng)</label>
                  <input
                    type="text"
                    value={routeStart}
                    onChange={(e) => setRouteStart(e.target.value)}
                    placeholder="1.320981,103.844150"
                    className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">End Point (lat,lng)</label>
                  <input
                    type="text"
                    value={routeEnd}
                    onChange={(e) => setRouteEnd(e.target.value)}
                    placeholder="1.326762,103.855900"
                    className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Route Type (routeType)</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['walk', 'pt', 'drive', 'cycle'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRouteType(type)}
                        className={`py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors ${
                          routeType === type
                            ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCalculatingRoute}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors shadow-md shadow-teal-500/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isCalculatingRoute ? 'Calculating Route...' : 'Calculate OneMap Route'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Output Console (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Terminal className="w-4 h-4 text-teal-400" />
                API Response Inspector
              </div>

              {((activeTab === 'token' && tokenResponse) ||
                (activeTab === 'search' && searchResponse) ||
                (activeTab === 'revgeocode' && revResponse) ||
                (activeTab === 'routing' && routeResponse)) && (
                <button
                  onClick={() => {
                    const data = activeTab === 'token' ? tokenResponse : activeTab === 'search' ? searchResponse : activeTab === 'revgeocode' ? revResponse : routeResponse;
                    copyToClipboard(JSON.stringify(data, null, 2));
                  }}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              )}
            </div>

            {/* Display Response */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
              {activeTab === 'token' && (
                tokenResponse ? (
                  <pre className="text-teal-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(tokenResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 py-16 text-center">
                    Submit the form on the left to mint and verify a OneMap token.
                  </div>
                )
              )}

              {activeTab === 'search' && (
                searchResponse ? (
                  <pre className="text-teal-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(searchResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 py-16 text-center">
                    Execute a search to inspect geocoded coordinates, postal codes, and building details.
                  </div>
                )
              )}

              {activeTab === 'revgeocode' && (
                revResponse ? (
                  <pre className="text-teal-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(revResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 py-16 text-center">
                    Enter coordinates to reverse-lookup Singapore HDB addresses and road names.
                  </div>
                )
              )}

              {activeTab === 'routing' && (
                routeResponse ? (
                  <pre className="text-teal-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(routeResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 py-16 text-center">
                    Calculate a route to inspect distance, senior walking minutes, and turn-by-turn guidance.
                  </div>
                )
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Powered by OneMap SLA REST APIs</span>
            <span className="font-mono text-teal-400">Status 200 OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
