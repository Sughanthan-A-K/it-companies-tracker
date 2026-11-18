import * as XLSX from 'xlsx';

export const exportToCSV = (companies) => {
  const headers = [
    "Company Name",
    "Area",
    "Category",
    "Address",
    "Phone",
    "Email",
    "Website",
    "Calling Status",
    "Physical Visit Status",
    "Contact Person / HR",
    "Notes",
    "Tech Stack",
    "Google Maps Search Query"
  ];

  const rows = companies.map(c => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.area || '').replace(/"/g, '""')}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.website || '').replace(/"/g, '""')}"`,
    `"${(c.callingStatus || '').replace(/"/g, '""')}"`,
    `"${(c.visitStatus || '').replace(/"/g, '""')}"`,
    `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
    `"${(Array.isArray(c.techStack) ? c.techStack.join(', ') : c.techStack || '').replace(/"/g, '""')}"`,
    `"${(c.mapsQuery || c.name + ' Pondicherry').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `Pondicherry_IT_Companies_Tracking_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (companies) => {
  const data = companies.map(c => ({
    "Company Name": c.name,
    "Area": c.area,
    "Category": c.category,
    "Phone": c.phone,
    "Email": c.email,
    "Calling Status": c.callingStatus,
    "Physical Visit Status": c.visitStatus,
    "Contact Person / HR": c.contactPerson,
    "Notes": c.notes,
    "Address": c.address,
    "Website": c.website,
    "Tech Stack": Array.isArray(c.techStack) ? c.techStack.join(', ') : c.techStack
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pondy IT Field Tracker");
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Pondicherry_IT_Companies_${timestamp}.xlsx`);
};

export const exportToJSON = (companies) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(companies, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  const timestamp = new Date().toISOString().slice(0, 10);
  dlAnchorElem.setAttribute("download", `pondy_it_companies_backup_${timestamp}.json`);
  dlAnchorElem.click();
};
