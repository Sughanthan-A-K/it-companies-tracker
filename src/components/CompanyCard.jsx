import React from 'react';
import { 
  Phone, 
  MapPin, 
  Globe, 
  Mail, 
  ExternalLink, 
  Navigation, 
  CheckCircle, 
  UserCheck, 
  Building, 
  Edit3, 
  Check, 
  Clock, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { CALLING_STATUS_CONFIG, VISIT_STATUS_CONFIG } from '../data/companies';

export default function CompanyCard({ company, onUpdateStatus, onUpdateNotes, onDelete }) {
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [tempNotes, setTempNotes] = React.useState(company.notes || '');
  const [tempContact, setTempContact] = React.useState(company.contactPerson || '');

  const saveNotes = () => {
    onUpdateNotes(company.id, {
      notes: tempNotes,
      contactPerson: tempContact
    });
    setIsEditingNotes(false);
  };

  const currentCallConfig = CALLING_STATUS_CONFIG[company.callingStatus] || CALLING_STATUS_CONFIG["Not Called"];
  const currentVisitConfig = VISIT_STATUS_CONFIG[company.visitStatus] || VISIT_STATUS_CONFIG["Yet to Visit"];

  // Google Maps URL
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    company.mapsQuery || `${company.name} ${company.area} Pondicherry`
  )}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
      {/* Top Banner & Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                <MapPin className="w-3 h-3 mr-1 text-sky-500" />
                {company.area}
              </span>
              {company.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                  {company.category}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-tight">
              {company.name}
            </h3>
          </div>
        </div>

        {/* Address */}
        <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-2 leading-relaxed">
          <span className="text-slate-400 mt-0.5 flex-shrink-0">📍</span>
          <span>{company.address}</span>
        </p>

        {/* Tech Stack Tags */}
        {company.techStack && company.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {company.techStack.map((tech, idx) => (
              <span key={idx} className="bg-slate-50 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200/60">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Status Dropdowns / Selectors */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
          {/* Calling Status Select */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-1">
              <span>Calling Status</span>
              <span className={`w-2 h-2 rounded-full ${currentCallConfig.dot}`}></span>
            </label>
            <select
              value={company.callingStatus}
              onChange={(e) => onUpdateStatus(company.id, 'callingStatus', e.target.value)}
              className={`w-full text-xs font-semibold rounded-xl py-2 px-3 border transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-sky-500/20 ${currentCallConfig.color}`}
            >
              {Object.keys(CALLING_STATUS_CONFIG).map((status) => (
                <option key={status} value={status} className="bg-white text-slate-800">
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Status Select */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-1">
              <span>Field Visit Status</span>
              <span className={`w-2 h-2 rounded-full ${currentVisitConfig.dot}`}></span>
            </label>
            <select
              value={company.visitStatus}
              onChange={(e) => onUpdateStatus(company.id, 'visitStatus', e.target.value)}
              className={`w-full text-xs font-semibold rounded-xl py-2 px-3 border transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-sky-500/20 ${currentVisitConfig.color}`}
            >
              {Object.keys(VISIT_STATUS_CONFIG).map((status) => (
                <option key={status} value={status} className="bg-white text-slate-800">
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Person & Notes Accordion / Box */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          {!isEditingNotes ? (
            <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60 text-xs">
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  Contact / HR:
                </span>
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-sky-600 hover:text-sky-700 flex items-center gap-1 font-semibold text-[11px]"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
              <p className="font-medium text-slate-800 mb-1.5">
                {company.contactPerson ? company.contactPerson : <span className="text-slate-400 italic">No contact specified</span>}
              </p>
              
              <div className="text-slate-600 pt-1.5 border-t border-slate-200/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Notes:</span>
                <p className="text-slate-700 line-clamp-2">
                  {company.notes ? company.notes : <span className="text-slate-400 italic">Tap edit to write interview notes or HR requirements...</span>}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-sky-50/60 rounded-xl p-3 border border-sky-200 space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">HR / Contact Person Name & Role</label>
                <input
                  type="text"
                  value={tempContact}
                  onChange={(e) => setTempContact(e.target.value)}
                  placeholder="e.g. Anand (HR Manager) / anand@company.com"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Field & Call Notes</label>
                <textarea
                  rows={2}
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="e.g. Visited 11 AM, handed resume, hiring junior React dev next week..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempNotes(company.notes || '');
                    setTempContact(company.contactPerson || '');
                    setIsEditingNotes(false);
                  }}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNotes}
                  className="px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Footer Buttons */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Call Now Button */}
        {company.phone ? (
          <a
            href={`tel:${company.phone.replace(/[^0-9+]/g, '')}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all text-center"
            title={`Call ${company.phone}`}
          >
            <Phone className="w-3.5 h-3.5 animate-pulse" />
            <span>Call Now</span>
          </a>
        ) : (
          <button
            disabled
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-200 text-slate-400 font-medium text-xs cursor-not-allowed"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>No Phone</span>
          </button>
        )}

        {/* Maps Navigate Button */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-sky-600/20 transition-all text-center"
          title="Open Directions in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Navigate</span>
        </a>

        {/* Website Button */}
        {company.website && (
          <a
            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
            title="Visit Company Website"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Email button if available */}
        {company.email && (
          <a
            href={`mailto:${company.email}?subject=Job Application / Inquiry regarding Opportunities`}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
            title={`Send Email to ${company.email}`}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
