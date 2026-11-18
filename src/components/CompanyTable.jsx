import React from 'react';
import { 
  Phone, 
  MapPin, 
  ExternalLink, 
  Navigation, 
  Mail, 
  Trash2, 
  Edit2, 
  Check, 
  FileText 
} from 'lucide-react';
import { CALLING_STATUS_CONFIG, VISIT_STATUS_CONFIG } from '../data/companies';

export default function CompanyTable({ companies, onUpdateStatus, onUpdateNotes, onDelete }) {
  const [editingId, setEditingId] = React.useState(null);
  const [tempNotes, setTempNotes] = React.useState('');
  const [tempContact, setTempContact] = React.useState('');

  const startEdit = (c) => {
    setEditingId(c.id);
    setTempNotes(c.notes || '');
    setTempContact(c.contactPerson || '');
  };

  const saveEdit = (id) => {
    onUpdateNotes(id, {
      notes: tempNotes,
      contactPerson: tempContact
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <th className="py-3.5 px-4 min-w-[200px]">Company Name & Area</th>
              <th className="py-3.5 px-4 min-w-[180px]">Calling Status</th>
              <th className="py-3.5 px-4 min-w-[180px]">Field Visit Status</th>
              <th className="py-3.5 px-4 min-w-[180px]">Contact Person & Notes</th>
              <th className="py-3.5 px-4 min-w-[130px]">Phone & Contact</th>
              <th className="py-3.5 px-4 text-center min-w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map((company) => {
              const currentCallConfig = CALLING_STATUS_CONFIG[company.callingStatus] || CALLING_STATUS_CONFIG["Not Called"];
              const currentVisitConfig = VISIT_STATUS_CONFIG[company.visitStatus] || VISIT_STATUS_CONFIG["Yet to Visit"];
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                company.mapsQuery || `${company.name} ${company.area} Pondicherry`
              )}`;

              return (
                <tr key={company.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Company Name & Area */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-slate-900 text-sm">{company.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        <MapPin className="w-3 h-3 mr-0.5 text-sky-500" />
                        {company.area}
                      </span>
                      {company.category && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {company.category}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 max-w-[240px] truncate" title={company.address}>
                      {company.address}
                    </div>
                  </td>

                  {/* Calling Status */}
                  <td className="py-3.5 px-4 align-top">
                    <select
                      value={company.callingStatus}
                      onChange={(e) => onUpdateStatus(company.id, 'callingStatus', e.target.value)}
                      className={`w-full text-xs font-semibold rounded-lg py-1.5 px-2 border outline-none cursor-pointer ${currentCallConfig.color}`}
                    >
                      {Object.keys(CALLING_STATUS_CONFIG).map((status) => (
                        <option key={status} value={status} className="bg-white text-slate-800">
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Field Visit Status */}
                  <td className="py-3.5 px-4 align-top">
                    <select
                      value={company.visitStatus}
                      onChange={(e) => onUpdateStatus(company.id, 'visitStatus', e.target.value)}
                      className={`w-full text-xs font-semibold rounded-lg py-1.5 px-2 border outline-none cursor-pointer ${currentVisitConfig.color}`}
                    >
                      {Object.keys(VISIT_STATUS_CONFIG).map((status) => (
                        <option key={status} value={status} className="bg-white text-slate-800">
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Contact Person & Notes */}
                  <td className="py-3.5 px-4 align-top">
                    {editingId === company.id ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={tempContact}
                          onChange={(e) => setTempContact(e.target.value)}
                          placeholder="Contact/HR Name"
                          className="w-full text-xs p-1.5 border border-sky-300 rounded bg-white"
                        />
                        <textarea
                          rows={2}
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Discussion / verification notes"
                          className="w-full text-xs p-1.5 border border-sky-300 rounded bg-white"
                        />
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(company.id)}
                            className="px-2 py-0.5 bg-sky-600 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative cursor-pointer" onClick={() => startEdit(company)}>
                        <div className="font-semibold text-slate-800 flex items-center justify-between">
                          <span>{company.contactPerson || <span className="text-slate-400 italic">No contact</span>}</span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                          {company.notes || <span className="text-slate-400 italic">Click to add notes...</span>}
                        </p>
                      </div>
                    )}
                  </td>

                  {/* Phone & Contact */}
                  <td className="py-3.5 px-4 align-top">
                    {company.phone ? (
                      <a
                        href={`tel:${company.phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{company.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                    {company.email && (
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                        {company.email}
                      </div>
                    )}
                  </td>

                  {/* Action buttons */}
                  <td className="py-3.5 px-4 align-top text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {company.phone && (
                        <a
                          href={`tel:${company.phone.replace(/[^0-9+]/g, '')}`}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors"
                          title="Call directly"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg transition-colors"
                        title="Google Maps Route"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                      {company.website && (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Company Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {company.email && (
                        <a
                          href={`mailto:${company.email}`}
                          className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
