import { storeService } from '@/lib/store';
import { getUzbekistanDateString, getMonthNameUz } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_LABELS: Record<string, { label: string; code: string; color: string; bg: string }> = {
  PRESENT: { label: 'Ishga kelgan', code: '8', color: '#166534', bg: '#dcfce7' },
  LATE: { label: 'Kechikib kelgan', code: 'Kch', color: '#854d0e', bg: '#fef9c3' },
  EXCUSED: { label: 'Javob olgan (Ruxsat)', code: 'J', color: '#1e40af', bg: '#dbeafe' },
  ABSENT: { label: 'Sababsiz kelmagan', code: 'S', color: '#991b1b', bg: '#fee2e2' },
  FIELD_WORK: { label: 'Xizmat safari (Dalada)', code: 'X', color: '#0f766e', bg: '#ccfbf1' },
  SICK_LEAVE: { label: 'Kasallik varaqasi', code: 'K', color: '#6b21a8', bg: '#f3e8ff' },
  DAY_OFF: { label: 'Dam olish kuni', code: 'D', color: '#475569', bg: '#f1f5f9' },
};

const DEFAULT_STATUS_INFO = { label: 'Noma‘lum', code: '-', color: '#475569', bg: '#f1f5f9' };

function getCellCode(record: any, isHoliday: boolean, isWeekendDay: boolean): string {
  if (!record) return isWeekendDay ? 'D' : '8';
  if (record.status === 'DAY_OFF') {
    return isHoliday ? 'B' : 'D';
  }
  if (record.status === 'PRESENT') return String(record.workHours || 8);
  if (record.status === 'LATE') return `${record.workHours || 8}`;
  if (record.status === 'EXCUSED') return 'J';
  if (record.status === 'ABSENT') return 'S';
  if (record.status === 'FIELD_WORK') return 'X';
  if (record.status === 'SICK_LEAVE') return 'K';
  return isWeekendDay ? 'D' : '8';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'xls';
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');

  // =========================================================================
  // 1. MONTHLY EXPORT MODE (Sentabr - Dekabr 2026)
  // =========================================================================
  if (monthParam && yearParam) {
    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);
    const monthData = storeService.getTimesheetForMonth(year, month);
    const monthName = getMonthNameUz(month);

    if (format === 'csv') {
      let csvContent = '\uFEFF'; // UTF-8 BOM
      const headerDays = monthData.days.map((d: any) => `"${d.dayNumber}-${d.dayOfWeek}"`).join(',');
      csvContent += `T/r,Xodim F.I.Sh,Tabel raqami,Lavozimi,${headerDays},Ish kunlari,Ish soatlari,Dam olish,Javob olgan,Sababsiz,Xizmat safari,Kasallik\n`;

      monthData.matrix.forEach((item: any, idx: number) => {
        const dayCols = item.records
          .map((r: any, i: number) => {
            const d = monthData.days[i];
            const isHol = Boolean(d && d.isHoliday);
            const isWk = Boolean(d && d.isWeekend);
            const code = getCellCode(r, isHol, isWk);
            return `"${code}"`;
          })
          .join(',');

        csvContent += `"${idx + 1}","${item.employee?.user?.name || item.employee?.id || ''}","${item.employee?.employeeCode || ''}","${item.employee?.position || ''}",${dayCols},"${item.summary?.totalWorkDays || 0}","${item.summary?.totalWorkHours || 0}","${item.summary?.totalDaysOff || 0}","${item.summary?.totalExcusedDays || 0}","${item.summary?.totalAbsentDays || 0}","${item.records.filter((r: any) => r && r.status === 'FIELD_WORK').length}","${item.summary?.totalSickDays || 0}"\n`;
      });

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Bandixon_Oylik_Tabel_${year}_${monthName}.csv"`,
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
                <x:Name>${monthName} ${year} Tabell</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #0f172a; }
          .header-title { font-size: 14pt; font-weight: bold; text-align: center; color: #0369a1; }
          .header-sub { font-size: 11pt; font-weight: bold; text-align: center; color: #334155; }
          .th-main { background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0369a1; vertical-align: middle; }
          .th-weekend { background-color: #cbd5e1; color: #334155; font-weight: bold; text-align: center; border: 1px solid #94a3b8; }
          .th-holiday { background-color: #fef08a; color: #854d0e; font-weight: bold; text-align: center; border: 1px solid #ca8a04; }
          td { border: 1px solid #cbd5e1; padding: 4px 6px; vertical-align: middle; }
          .cell-center { text-align: center; }
          .cell-bold { font-weight: bold; }
          .cell-weekend { background-color: #f1f5f9; color: #64748b; font-weight: bold; text-align: center; }
          .cell-holiday { background-color: #fef9c3; color: #854d0e; font-weight: bold; text-align: center; }
          .cell-work { background-color: #f0fdf4; color: #166534; font-weight: bold; text-align: center; }
          .cell-excused { background-color: #e0f2fe; color: #0284c7; font-weight: bold; text-align: center; }
          .cell-absent { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
          .cell-total { background-color: #f8fafc; font-weight: bold; text-align: center; }
          .legend-box { font-size: 9pt; color: #475569; padding: 4px; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="${monthData.totalDays + 11}" class="header-title">O‘ZBEKISTON RESPUBLIKASI O‘SIMLIKLAR KARANTINI VA HIMOYASI AGENTLIGI</td>
          </tr>
          <tr>
            <td colspan="${monthData.totalDays + 11}" class="header-sub">BANDIXON TUMAN O‘SIMLIKLAR KARANTINI VA HIMOYASI BO‘LIMI</td>
          </tr>
          <tr>
            <td colspan="${monthData.totalDays + 11}" class="header-title" style="font-size: 12pt; color: #0f172a; padding: 6px 0;">
              XODIMLARNING ISH VAQTIDAN FOYDALANISH VA DAVOMAT TABELI (T-12 Shakli)
            </td>
          </tr>
          <tr>
            <td colspan="${monthData.totalDays + 11}" style="text-align: center; font-weight: bold; color: #0284c7; padding-bottom: 8px;">
              Davr: 2026-yil ${monthName} oyi (1 - ${monthData.totalDays} ${monthName})
            </td>
          </tr>

          <!-- Legend Bar -->
          <tr>
            <td colspan="${monthData.totalDays + 11}" class="legend-box" style="border: none;">
              <b>Shartli belgilar:</b> 8 - Ish kuni (8 soat) | D - Dam olish kuni (Shanba, Bozor) | B - Rasmiy bayram kuni | J - Javob olgan (ruxsat) | S - Sababsiz kelmagan | X - Xizmat safari (dalada) | K - Kasallik varaqasi
            </td>
          </tr>
          <tr><td colspan="${monthData.totalDays + 11}" style="border: none; height: 6px;"></td></tr>

          <thead>
            <tr>
              <th rowspan="2" class="th-main" style="width: 35px;">T/r</th>
              <th rowspan="2" class="th-main" style="width: 220px;">Xodim F.I.Sh</th>
              <th rowspan="2" class="th-main" style="width: 80px;">Tabel №</th>
              <th rowspan="2" class="th-main" style="width: 200px;">Lavozimi</th>
              <th colspan="${monthData.totalDays}" class="th-main">Oy kunlari bo‘yicha ish vaqti va davomat (${monthName} 2026)</th>
              <th colspan="7" class="th-main" style="background-color: #0369a1;">JAMI KO‘RSATKICHLAR</th>
            </tr>
            <tr>
              ${monthData.days
                .map((d) => {
                  let cls = 'th-main';
                  if (d.isHoliday) cls = 'th-holiday';
                  else if (d.isWeekend) cls = 'th-weekend';
                  return `<th class="${cls}" style="width: 28px;">${d.dayNumber}<br/><span style="font-size: 8pt;">${d.dayOfWeek}</span></th>`;
                })
                .join('')}
              <th class="th-main" style="background-color: #0f766e; width: 55px;">Ish kuni</th>
              <th class="th-main" style="background-color: #0f766e; width: 60px;">Ish soati</th>
              <th class="th-main" style="background-color: #475569; width: 50px;">Dam</th>
              <th class="th-main" style="background-color: #0284c7; width: 50px;">Javob</th>
              <th class="th-main" style="background-color: #b91c1c; width: 50px;">Sababsiz</th>
              <th class="th-main" style="background-color: #0d9488; width: 50px;">Dalada</th>
              <th class="th-main" style="background-color: #7c3aed; width: 50px;">Kasal</th>
            </tr>
          </thead>
          <tbody>
            ${monthData.matrix
              .map((row: any, idx: number) => {
                const dayTds = row.records
                  .map((r: any, i: number) => {
                    const d = monthData.days[i];
                    const isHol = Boolean(d && d.isHoliday);
                    const isWk = Boolean(d && d.isWeekend);
                    const code = getCellCode(r, isHol, isWk);
                    let cellClass = 'cell-work';
                    if (code === 'D') cellClass = 'cell-weekend';
                    else if (code === 'B') cellClass = 'cell-holiday';
                    else if (code === 'J') cellClass = 'cell-excused';
                    else if (code === 'S') cellClass = 'cell-absent';
                    return `<td class="${cellClass}">${code}</td>`;
                  })
                  .join('');

                const fieldWorkDays = row.records.filter((r: any) => r && r.status === 'FIELD_WORK').length;

                return `
                  <tr>
                    <td class="cell-center cell-bold">${idx + 1}</td>
                    <td class="cell-bold">${row.employee.user?.name || row.employee.id}</td>
                    <td class="cell-center" style="font-family: monospace;">${row.employee.employeeCode}</td>
                    <td>${row.employee.position}</td>
                    ${dayTds}
                    <td class="cell-total font-bold" style="color: #166534;">${row.summary.totalWorkDays}</td>
                    <td class="cell-total font-bold" style="color: #166534;">${row.summary.totalWorkHours}</td>
                    <td class="cell-total" style="color: #64748b;">${row.summary.totalDaysOff}</td>
                    <td class="cell-total" style="color: #0284c7;">${row.summary.totalExcusedDays}</td>
                    <td class="cell-total font-bold" style="color: #b91c1c;">${row.summary.totalAbsentDays}</td>
                    <td class="cell-total font-bold" style="color: #0d9488;">${fieldWorkDays}</td>
                    <td class="cell-total" style="color: #7c3aed;">${row.summary.totalSickDays}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="${monthData.totalDays + 11}" style="border: none; height: 16px;"></td></tr>
            <tr>
              <td colspan="8" style="border: none; font-weight: bold;">
                Bo‘lim boshlig‘i: _________________ Bo‘riyev Shuxrat Xursandovich
              </td>
              <td colspan="${monthData.totalDays + 3}" style="border: none; text-align: right; font-weight: bold;">
                Tabel tuzuvchi / Mas'ul inspektor: _________________
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
        'Content-Disposition': `attachment; filename="Bandixon_Karantin_Oylik_Tabel_${year}_${monthName}.xls"`,
      },
    });
  }

  // =========================================================================
  // 2. DAILY EXPORT MODE (Selected single day)
  // =========================================================================
  const date = searchParams.get('date') || getUzbekistanDateString();
  const records = storeService.getTimesheetByDate(date);

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const fieldWorkCount = records.filter((r) => r.status === 'FIELD_WORK').length;

  const dateParts = date.split('-');
  const displayDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : date;

  if (format === 'csv') {
    let csvContent = '\uFEFF';
    csvContent += 'T/r,Xodim F.I.Sh,Tabel raqami,Lavozimi,Holati,Kelgan vaqti,Ketgan vaqti,Ishlagan soati,Sababi / Soatma-soat izohi,Qayd etuvchi\n';

    records.forEach((r, idx) => {
      const statusInfo = STATUS_LABELS[r.status] || { ...DEFAULT_STATUS_INFO, label: r.status };
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
              const statusInfo = STATUS_LABELS[r.status] || { ...DEFAULT_STATUS_INFO, label: r.status };
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
