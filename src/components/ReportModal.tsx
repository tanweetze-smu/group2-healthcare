import React from 'react';
import { PlanningArea, HealthcareFacility } from '../types';
import { X, Download, FileText, CheckCircle2, Building, ShieldCheck, Compass, Database } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  planningAreas: PlanningArea[];
  facilities: HealthcareFacility[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  planningAreas,
  facilities
}) => {
  if (!isOpen) return null;

  const downloadFullDatasetCSV = () => {
    const headers = [
      'Planning Area',
      'Region',
      'Total Population',
      'Seniors 65+',
      'Aging Percentage (%)',
      'Area (sq km)',
      'Senior Density (/sq km)',
      'Total Healthcare Facilities',
      'Polyclinics',
      'Hospitals',
      'Eldercare Centres',
      'Nursing Homes',
      'Facilities per 10k Seniors',
      'Pct Within 15 Min Walk',
      'Accessibility Grade'
    ].join(',');

    const rows = planningAreas.map(pa => [
      `"${pa.name}"`,
      `"${pa.region}"`,
      pa.totalPopulation,
      pa.seniorPopulation,
      pa.agingPercentage,
      pa.areaSqKm,
      pa.seniorDensityPerSqKm,
      pa.totalHealthcareFacilities,
      pa.polyclinicsCount,
      pa.hospitalsCount,
      pa.eldercareCentresCount,
      pa.nursingHomesCount,
      pa.facilitiesPer10kSeniors.toFixed(2),
      pa.pctWithin15MinWalk,
      `"${pa.accessibilityGrade}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Singapore_Healthcare_Density_Aging_Project_Dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Class Project Synthesis: Healthcare Density for Aging Population
              </h2>
              <div className="text-xs text-slate-400">
                Singapore Land Authority OneMap & SingStat TableBuilder API Integration
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadFullDatasetCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Clean Dataset (CSV)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Document */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Executive Summary */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-teal-400">
              1. Executive Summary & Research Question
            </h3>
            <p className="text-slate-300">
              This interactive research project investigates spatial accessibility and healthcare facility density across Singapore's 20 residential planning areas as the nation transitions into a <strong>Super-Aged Society</strong> (&gt;21% aged 65+) by 2026. Leveraging real-time data from <strong>SingStat TableBuilder</strong> (M810001, M810571, M850021) and geospatial routing from <strong>Singapore Land Authority's OneMap API</strong>, this dashboard models whether eldercare infrastructure matches the localized geographic concentration of senior citizens.
            </p>
          </section>

          {/* Key Empirical Findings */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-teal-400">
              2. Key Empirical Findings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-white">Mature Town Saturation</div>
                <p className="text-slate-400 text-[11px]">
                  <strong>Bedok, Toa Payoh, and Ang Mo Kio</strong> lead Singapore with senior concentrations exceeding 22–25%. Bedok alone accommodates over 63,000 seniors, necessitating higher decentralized AAC capacity.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-white">The 15-Minute Care Deficit</div>
                <p className="text-slate-400 text-[11px]">
                  While Central planning areas (Outram, Bukit Merah) achieve <strong>&gt;88%</strong> 15-minute walking accessibility to primary polyclinics, outer mature estates average only <strong>72–75%</strong>, leaving vulnerable seniors dependent on feeder buses.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-white">Dependency Ratio Shift</div>
                <p className="text-slate-400 text-[11px]">
                  The Old-Age Support Ratio has contracted from <strong>5.7 working adults per senior in 2014 to 3.1 in 2025</strong>, making ambulatory preventive care and community rehabilitation vital to prevent acute hospital bed bottlenecks.
                </p>
              </div>
            </div>
          </section>

          {/* API Architectures Validated */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-teal-400">
              3. Government API Architecture Implemented
            </h3>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <Database className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-white">SingStat TableBuilder API</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Integrated endpoint for searching table resources (<code>/api/table/resourceid</code>), schema inspection (<code>/api/table/metadata/M213751</code>), and row-level series extraction (<code>/api/table/tabledata/M810001</code>).
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <Compass className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-white">SLA OneMap REST & Routing APIs</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Authenticated via 3-day bearer tokens (<code>/api/auth/post/getToken</code>), Elastic geocoder (<code>/api/common/elastic/search</code>), reverse geocoder (<code>/api/public/revgeocode</code>), and multimodal routing engine (<code>/api/public/routingsvc/route</code>) tailored to elderly walking speeds (1.05 m/s).
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Policy Recommendations */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-teal-400">
              4. Policy Recommendations for Urban Health Planning
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li>
                <strong>Prioritize Active Ageing Hub Expansion in Bedok North & Hougang:</strong> Deploying satellite community kiosks within HDB void decks reduces walking distance by up to 450m for vulnerable elderly.
              </li>
              <li>
                <strong>Accelerate Silver Zone Sheltered Walkway Infrastructure:</strong> Ensure signalized crossings, anti-slip ramps, and resting benches along key walking paths connecting HDB clusters to Heartbeat@Bedok and regional polyclinics.
              </li>
              <li>
                <strong>Subacute Step-Down Beds:</strong> Continue expanding community hospital beds adjacent to acute campuses (like SGH Outram and Yishun Community Hospital) to facilitate early post-stroke rehabilitation.
              </li>
            </ul>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>SingStat & OneMap API Integration Class Project</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
