import React from 'react';
import { 
  Building2, 
  PhoneCall, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';

export default function StatsBar({ companies }) {
  const total = companies.length;
  
  // Calling statistics
  const notCalled = companies.filter(c => c.callingStatus === 'Not Called').length;
  const calledTotal = total - notCalled;
  const callingPercent = total > 0 ? Math.round((calledTotal / total) * 100) : 0;
  
  // Positive opportunities / interviews
  const positiveCalls = companies.filter(c => 
    c.callingStatus === 'Called - Positive / Interview Scheduled'
  ).length;

  // Visit statistics
  const visitedCompleted = companies.filter(c => 
    c.visitStatus === 'Direct Visit Completed - Met HR/Manager' || 
    c.visitStatus === 'Office Found & Verified'
  ).length;
  const visitPercent = total > 0 ? Math.round((visitedCompleted / total) * 100) : 0;
  const balanceToVisit = total - visitedCompleted;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Companies */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Database</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{total}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-sky-700">
            <Sparkles className="w-3.5 h-3.5" /> Pondicherry Tech Hub
          </span>
          <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-[11px] font-semibold">Verified</span>
        </div>
      </div>

      {/* Calling Progress */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calling Outreach</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{calledTotal}</h3>
              <span className="text-xs font-medium text-slate-500">/ {total} called</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-indigo-700">{callingPercent}% Progress</span>
            <span className="text-slate-400 font-normal">{notCalled} balance</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${callingPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Field Visits Done vs Balance */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Field Visits Done</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{visitedCompleted}</h3>
              <span className="text-xs font-medium text-slate-500">verified on-ground</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-emerald-700">{visitPercent}% Visited</span>
            <span className="text-slate-400 font-normal">{balanceToVisit} yet to visit</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${visitPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Positive Leads / Opportunities */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Positive Leads / Hiring</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{positiveCalls}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center border border-white/30">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-emerald-500/40 flex items-center justify-between text-xs">
          <span className="text-emerald-100">Interviews & strong opportunities</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold text-white text-[11px]">
            {total > 0 ? Math.round((positiveCalls / total) * 100) : 0}% Yield
          </span>
        </div>
      </div>
    </div>
  );
}
