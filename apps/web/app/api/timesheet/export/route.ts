import { storeService } from '@/lib/store';
import { getUzbekistanDateString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT: { label: 'Ishga kelgan', color: '#166534', bg: '#dcfce7' },
  LATE: { label: 'Kechikib kelgan', color: '#854d0e', bg: '#fef9c3' },
  EXCUSED: { label: 'Javob olgan (Ruxsat)', color: '#1e40af', bg: '#dbeafe' },
  ABSENT: { label: 'Sababsiz kelmagan', color: '#991b1b', bg: '#fee2e2' },
  FIELD_WORK: { label: 'Xizmat safari (Dalada)', color: '#0f766e', bg: '#ccfbf1' },
  SICK_LEAVE: { label: 'Kasallik varaqasi', color: '#6b21a8', bg: '#f3e8ff' },
  DAY_OFF: { label: 'Dam olish kuni', color: '#475569', bg: '#f1f5f9' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || getUzbekistanDateString();
  const format = searchParams.get('format') || 'xls';

  const records = storeService.getTimesheetByDate(date);

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const fieldWorkCount = records.filter((r) => r.status === 'FIELD_WORK').length;

  // Format date in Uzbek style (e.g., "05.10.2026")
  const dateParts = date.split('-');
  const displayDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : date;

  if (format === 'csv') {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel compatibility
    csvContent += 'T/r,Xodim F.I.Sh,Tabel raqami,Lavozimi,Holati,Kelgan vaqti,Ketgan vaqti,Ishlagan soati,Sababi / Soatma-soat izohi,Qayd etuvchi\n';

    records.forEach((r, idx) => {
      const statusInfo = STATUS_LABELS[r.status] || { label: r.status };
      const line = `"${idx + 1}","${r.employeeName}","${r.employeeCode}","${r.position}","${statusInfo.label}","${r.checkInTime || '-'}","${r.checkOutTime || '-'}","${r.workHours}","${(r.reason || r.hourlyLog || '').replace(/"/g, '""')}","${r.recordedBy || 'Bo‘lim boshlig‘i'}"\n`;
      csvContent += line;
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Bandixon_Kunlik_Tabel_${date}.csv"`,
      },
    });
  }

  // Official Excel XML/HTML Spreadsheet format (.xls)
  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Kunlik Tabel ${displayDate}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; }
        .header-title { font-size: 15pt; font-weight: bold; text-align: center; color: #0369a1; }
        .header-subtitle { font-size: 11pt; text-align: center; color: #475569; }
        .table-header { background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0369a1; }
        td { border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: middle; }
        .center { text-align: center; }
        .right { text-align: right; }
        .font-bold { font-weight: bold; }
        .summary-box { background-color: #f0fdf4; border: 1px solid #86efac; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="9" class="header-title">O‘ZBEKISTON RESPUBLIKASI O‘SIMLIKLAR KARANTINI VA HIMOYASI AGENTLIGI</td>
        </tr>
        <tr>
          <td colspan="9" class="header-subtitle">BANDIXON TUMAN O‘SIMLIKLAR KARANTINI VA HIMOYASI BO‘LIMI</td>
        </tr>
        <tr>
          <td colspan="9" class="header-title" style="font-size: 13pt; color: #0f172a; padding: 8px 0;">
            XODIMLARNING KUNLIK ISHGA KELDI-KETDI VA DAVOMAT TABELI
          </td>
        </tr>
        <tr>
          <td colspan="5" style="border: none; font-weight: bold; color: #0284c7;">
            Sana: ${displayDate} yil
          </td>
          <td colspan="4" style="border: none; text-align: right; color: #64748b;">
            Tasdiqlayman: Bo‘lim boshlig‘i Bo‘riyev Shuxrat Xursandovich
          </td>
        </tr>
        <tr><td colspan="9" style="border: none; height: 10px;"></td></tr>
        <thead>
          <tr>
            <th class="table-header" style="width: 40px;">T/r</th>
            <th class="table-header" style="width: 250px;">Xodim F.I.Sh</th>
            <th class="table-header" style="width: 90px;">Tabel №</th>
            <th class="table-header" style="width: 220px;">Lavozimi</th>
            <th class="table-header" style="width: 150px;">Holati</th>
            <th class="table-header" style="width: 90px;">Kelgan vaqti</th>
            <th class="table-header" style="width: 90px;">Ketgan vaqti</th>
            <th class="table-header" style="width: 80px;">Ishlagan soati</th>
            <th class="table-header" style="width: 300px;">Sababi / Soatma-soat izohi</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map((r, idx) => {
              const statusInfo = STATUS_LABELS[r.status] || { label: r.status, color: '#000', bg: '#fff' };
              return `
                <tr>
                  <td class="center font-bold">${idx + 1}</td>
                  <td class="font-bold">${r.employeeName}</td>
                  <td class="center" style="font-family: monospace;">${r.employeeCode}</td>
                  <td>${r.position}</td>
                  <td class="center font-bold" style="background-color: ${statusInfo.bg}; color: ${statusInfo.color};">
                    ${statusInfo.label}
                  </td>
                  <td class="center font-bold" style="color: #0369a1;">${r.checkInTime || '-'}</td>
                  <td class="center font-bold" style="color: #0369a1;">${r.checkOutTime || '-'}</td>
                  <td class="center font-bold">${r.workHours} soat</td>
                  <td style="color: #334155;">${r.reason || r.hourlyLog || '-'}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="9" style="border: none; height: 12px;"></td></tr>
          <tr class="summary-box">
            <td colspan="4" class="font-bold" style="padding: 10px;">
              KUNLIK STATISTIKA: Jami xodimlar: ${records.length} nafar
            </td>
            <td colspan="5" class="right font-bold" style="padding: 10px;">
              Ishda: ${presentCount} ta | Kechikkan: ${lateCount} ta | Javob olgan: ${excusedCount} ta | Sababsiz: ${absentCount} ta | Dalada: ${fieldWorkCount} ta
            </td>
          </tr>
          <tr><td colspan="9" style="border: none; height: 25px;"></td></tr>
          <tr>
            <td colspan="4" style="border: none; font-weight: bold;">
              Bo‘lim boshlig‘i: _________________ (Bo‘riyev Sh.X.)
            </td>
            <td colspan="5" style="border: none; text-align: right; font-weight: bold;">
              Kadrlar / Mas'ul inspektor: _________________
            </td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  return new Response(excelHtml, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="Bandixon_Karantin_Kunlik_Tabel_${date}.xls"`,
    },
  });
}
