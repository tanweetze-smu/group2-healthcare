import React, { useState, useEffect } from 'react';
import { searchSingStat, fetchSingStatMetadata, fetchSingStatTableData } from '../services/apiService';
import { SingStatSearchResult, SingStatMetadata, SingStatTableDataResponse } from '../types';
import { Search, Database, FileText, ArrowRight, Table, Download, ExternalLink, RefreshCw, CheckCircle, Code } from 'lucide-react';

export const SingStatExplorer: React.FC = () => {
  const [keyword, setKeyword] = useState('aging');
  const [searchOption, setSearchOption] = useState<'all' | 'title' | 'variable'>('title');
  const [searchResults, setSearchResults] = useState<SingStatSearchResult[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('M810001');
  
  // Data fetch states
  const [metadata, setMetadata] = useState<SingStatMetadata | null>(null);
  const [tableData, setTableData] = useState<SingStatTableDataResponse | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'data' | 'metadata' | 'rawJson'>('data');
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);

  // TableData filters
  const [limitFilter, setLimitFilter] = useState<number>(6);
  const [timeFilter, setTimeFilter] = useState<string>('');
  const [seriesNoFilter, setSeriesNoFilter] = useState<string>('');

  // Initial load
  useEffect(() => {
    handleSearch('aging');
    loadTable('M810001');
  }, []);

  const handleSearch = async (kwToSearch: string) => {
    setIsLoadingSearch(true);
    try {
      const res = await searchSingStat(kwToSearch, searchOption);
      const recs = res.data?.data?.records || [];
      setSearchResults(recs);
    } catch (err) {
      console.error('SingStat Search Error', err);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const loadTable = async (tableId: string) => {
    setSelectedTableId(tableId);
    setIsLoadingDetails(true);
    try {
      const [metaRes, dataRes] = await Promise.all([
        fetchSingStatMetadata(tableId),
        fetchSingStatTableData(tableId, {
          limit: limitFilter || undefined,
          timeFilter: timeFilter || undefined,
          seriesNoORrowNo: seriesNoFilter || undefined
        })
      ]);

      setMetadata(metaRes.data?.data || null);
      setTableData(dataRes.data || null);
      setRawApiResponse({ metadata: metaRes, tableData: dataRes });
    } catch (err) {
      console.error('Failed to load table details', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const downloadCSV = () => {
    if (!tableData?.Data?.row || tableData.Data.row.length === 0) return;
    const rows = tableData.Data.row;
    const headerCols = rows[0]?.columns?.map(c => c.key) || [];
    const csvHeader = ['Series No', 'Series Label', ...headerCols].join(',');
    const csvRows = rows.map(r => {
      const colValues = r.columns?.map(c => `"${c.value}"`) || [];
      return [r.rowNo, `"${r.rowText}"`, ...colValues].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [csvHeader, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SingStat_${selectedTableId}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Banner / Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Database className="w-4 h-4" />
            Official SingStat TableBuilder API Integration
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Singapore National Demographic & Healthcare Data Tables
          </h1>
          <p className="text-slate-400 text-xs max-w-3xl mt-1">
            Access demographic time-series directly from Singapore Department of Statistics (SingStat). Query resource IDs, inspect table schema metadata, and pull row series for aging populations, hospital beds, and healthcare indices.
          </p>
        </div>

        {/* Quick Example Presets from prompt */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800 shrink-0">
          <span className="text-[11px] text-slate-400 px-1 font-medium">Try Prompt Tables:</span>
          <button
            onClick={() => { loadTable('M810001'); }}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${selectedTableId === 'M810001' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            M810001 (Pop)
          </button>
          <button
            onClick={() => { loadTable('M810571'); }}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${selectedTableId === 'M810571' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            M810571 (Areas)
          </button>
          <button
            onClick={() => { loadTable('M850021'); }}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${selectedTableId === 'M850021' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            M850021 (Beds)
          </button>
          <button
            onClick={() => { loadTable('M213751'); }}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${selectedTableId === 'M213751' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            M213751 (CPI)
          </button>
          <button
            onClick={() => { loadTable('M015021'); }}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${selectedTableId === 'M015021' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            M015021 (GDP)
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Table Search & Catalog List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>#1. Find a Table ID</span>
            <span className="text-[10px] font-mono text-teal-400">/api/table/resourceid</span>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(keyword); }}
            className="space-y-2.5"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search keyword e.g. population, cpi, health..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Option:</span>
                <select
                  value={searchOption}
                  onChange={(e) => setSearchOption(e.target.value as any)}
                  className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] focus:outline-none"
                >
                  <option value="title">title</option>
                  <option value="variable">variable</option>
                  <option value="all">all</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoadingSearch}
                className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors"
              >
                {isLoadingSearch ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Results List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Matching Tables:</span>
              <span className="font-mono text-teal-400">{searchResults.length} found</span>
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {searchResults.map((rec) => {
                const isSelected = selectedTableId.toUpperCase() === rec.resourceId.toUpperCase();
                return (
                  <div
                    key={rec.resourceId}
                    onClick={() => loadTable(rec.resourceId)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all text-xs space-y-1 ${
                      isSelected
                        ? 'bg-teal-950/40 border-teal-500/50 shadow-sm'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-300 text-[11px]">{rec.resourceId}</span>
                      <span className="text-[10px] text-slate-400">{rec.frequency}</span>
                    </div>
                    <div className="font-medium text-slate-200 leading-snug">{rec.tableTitle}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <span>{rec.theme}</span>
                      <span>·</span>
                      <span>{rec.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Table Data Explorer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Table Header Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    {selectedTableId}
                  </span>
                  <span className="text-xs text-slate-400">SingStat API Resource</span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight mt-1">
                  {metadata?.title || `TableBuilder Resource ${selectedTableId}`}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
                <button
                  onClick={() => loadTable(selectedTableId)}
                  disabled={isLoadingDetails}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                  title="Reload table"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDetails ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Query parameters bar (#3) */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              <span className="text-teal-400 font-semibold text-[11px]">API Query Filters:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">limit:</span>
                <input
                  type="number"
                  value={limitFilter}
                  onChange={(e) => setLimitFilter(Number(e.target.value))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                  placeholder="6"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">timeFilter:</span>
                <input
                  type="text"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  placeholder="2024,2025"
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                />
              </div>

              <button
                onClick={() => loadTable(selectedTableId)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs rounded border border-slate-700 transition-colors font-medium ml-auto"
              >
                Apply Parameters
              </button>
            </div>

            {/* Sub Tabs: Data vs Metadata vs Raw JSON */}
            <div className="flex items-center gap-1 border-b border-slate-800 pt-1">
              <button
                onClick={() => setActiveSubTab('data')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeSubTab === 'data'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Table Series Data ({tableData?.Data?.row?.length || 0} rows)
              </button>

              <button
                onClick={() => setActiveSubTab('metadata')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeSubTab === 'metadata'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Table Metadata Schema
              </button>

              <button
                onClick={() => setActiveSubTab('rawJson')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeSubTab === 'rawJson'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Raw API Payload
              </button>
            </div>

            {/* Sub Tab Viewports */}
            {isLoadingDetails ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400" />
                <div>Fetching data from SingStat TableBuilder API...</div>
              </div>
            ) : activeSubTab === 'data' ? (
              /* Tabular Data Viewport */
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                {tableData?.Data?.row && tableData.Data.row.length > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Row #</th>
                        <th className="py-2.5 px-4 font-semibold">Demographic Series / Indicator</th>
                        {tableData.Data.row[0]?.columns?.map((col) => (
                          <th key={col.key} className="py-2.5 px-4 font-semibold text-right font-mono">
                            {col.key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {tableData.Data.row.map((row) => (
                        <tr key={row.rowNo} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-teal-400 font-medium">
                            {row.rowNo}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-100 whitespace-nowrap">
                            {row.rowText}
                          </td>
                          {row.columns?.map((col, idx) => (
                            <td key={idx} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                              {col.value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No series records returned for this table query.
                  </div>
                )}
              </div>
            ) : activeSubTab === 'metadata' ? (
              /* Metadata Viewport */
              <div className="space-y-4 p-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Data Frequency</div>
                    <div className="font-semibold text-slate-100 mt-0.5">{metadata?.frequency || 'Annual'}</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Source Agency</div>
                    <div className="font-semibold text-slate-100 mt-0.5">{metadata?.source || 'Department of Statistics'}</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Unit of Measure</div>
                    <div className="font-semibold text-slate-100 mt-0.5">{metadata?.unitOfMeasure || 'Number / Ratio'}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-200">Table Footnote / Methodology:</div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {metadata?.footnote || 'Figures are compiled based on Census of Population, Population Estimates, and Administrative registers from Ministry of Health Singapore.'}
                  </p>
                </div>

                {metadata?.variables && metadata.variables.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-300">Table Variables ({metadata.variables.length})</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {metadata.variables.map(v => (
                        <div key={v.variableNo} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                          <span className="font-mono text-teal-400 font-bold">{v.variableNo}.</span>{' '}
                          <span className="text-slate-300">{v.variableName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Raw JSON Viewport */
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 max-h-96 overflow-y-auto">
                <pre className="text-[11px] font-mono text-teal-300 leading-relaxed">
                  {JSON.stringify(rawApiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
