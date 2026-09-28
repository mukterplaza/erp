export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) {
    alert("No records to export.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(filename: string, title: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) {
    alert("No records to export.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"></head>
    <body>
      <h2>INSAF ERP - ${title}</h2>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table border="1">
        <thead>
          <tr style="background:#0f172a;color:#ffffff;font-weight:bold;">
            ${headers.map((h) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${headers
                  .map((h) => `<td>${r[h] !== null && r[h] !== undefined ? String(r[h]) : ""}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDFPrint(title: string, subtitle: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) {
    window.print();
    return;
  }
  const headers = Object.keys(rows[0]);
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) {
    window.print();
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>INSAF ERP - ${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          h1 { margin: 0; font-size: 22px; }
          p { margin: 4px 0; font-size: 12px; color: #475569; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INSAF BUILDING & CONSTRUCTION ERP</h1>
            <p>${title} — ${subtitle}</p>
          </div>
          <div style="text-align:right">
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Verified Financial & Operational Report</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${headers
                    .map((h) => `<td>${r[h] ?? ""}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}
