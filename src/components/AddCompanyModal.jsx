import React, { useState } from 'react';
import { X, Building, MapPin, Phone, Globe, Mail, Code, FileText, Plus } from 'lucide-react';
import { DEFAULT_AREAS } from '../data/companies';

export default function AddCompanyModal({ isOpen, onClose, onAddCompany }) {
  const [formData, setFormData] = useState({
    name: '',
    area: 'Lawspet',
    category: 'Software Development & IT Solutions',
    address: '',
    phone: '',
    email: '',
    website: '',
    techStack: '',
    notes: '',
    contactPerson: '',
    mapsQuery: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newCompany = {
      id: `comp-${Date.now()}`,
      name: formData.name.trim(),
      area: formData.area,
      category: formData.category.trim() || 'Software & IT Services',
      address: formData.address.trim() || `${formData.area}, Pondicherry`,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      website: formData.website.trim(),
      techStack: formData.techStack
        ? formData.techStack.split(',').map(s => s.trim()).filter(Boolean)
        : ['Web Tech', 'Software'],
      callingStatus: 'Not Called',
      visitStatus: 'Yet to Visit',
      contactPerson: formData.contactPerson.trim(),
      notes: formData.notes.trim(),
      mapsQuery: formData.mapsQuery.trim() || `${formData.name} ${formData.area} Pondicherry`,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    onAddCompany(newCompany);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Add New IT Company</h3>
              <p className="text-xs text-sky-100">Add discovered tech firm in Pondicherry to live CRM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Company Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hexaware Technologies Pondicherry"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Area & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Area in Pondicherry <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none cursor-pointer"
              >
                {DEFAULT_AREAS.filter(a => a !== 'All Areas').map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
                <option value="Other Area">Other / ECR / Gorimedu</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Domain / Category</label>
              <input
                type="text"
                placeholder="e.g. Web Apps, SaaS, Mobile, ERP"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Street Address / Landmark</label>
            <input
              type="text"
              placeholder="e.g. 2nd Floor, Anna Salai, Near IG Square..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (Calling)</label>
              <input
                type="text"
                placeholder="+91 98XXXXXXXX or 0413 XXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email / HR Email</label>
              <input
                type="email"
                placeholder="careers@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Website & Tech Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tech Stack (comma separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, Python, AWS"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Contact Person & Initial Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">HR / Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Ramesh (HR Head)"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custom Notes / Hiring Info</label>
              <input
                type="text"
                placeholder="e.g. Walk-ins allowed 10 AM - 1 PM"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Save Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
