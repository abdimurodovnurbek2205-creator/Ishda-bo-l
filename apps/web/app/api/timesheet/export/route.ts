import ExcelJS from 'exceljs';
import { storeService } from '@/lib/store';
import { getUzbekistanDateString, getMonthNameUz } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

const BORDER_HEADER: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: 'FF0369A1' } },
  left: { style: 'thin', color: { argb: 'FF0284C7' } },
  bottom: { style: 'medium', color: { argb: 'FF0369A1' } },
  right: { style: 'thin', color: { argb: 'FF0284C7' } },
};

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

function styleAttendanceCell(cell: ExcelJS.Cell, code: string, isHoliday: boolean, isWeekend: boolean) {
  cell.border = BORDER_THIN;
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.font = { name: 'Calibri', size: 9, bold: true };

  if (code === 'B' || isHoliday) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF854D0E' } };
  } else if (code === 'D' || isWeekend) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
  } else if (code === '8' || (!isNaN(Number(code)) && Number(code) > 0)) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF166534' } };
  } else if (code === 'Kch') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF854D0E' } };
  } else if (code === 'J') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E40AF' } };
  } else if (code === 'S') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF991B1B' } };
  } else if (code === 'X') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F766E' } };
  } else if (code === 'K') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF6B21A8' } };
  }
}

// Convert 1-based column number to Excel column letters (1 -> A, 27 -> AA)
function colLetter(colNumber: number): string {
  let temp = colNumber;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'xlsx';
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

    // CSV format fallback if requested
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

    // NATIVE MICROSOFT EXCEL (.xlsx) VIA EXCELJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bandixon O‘simliklar Karantini va Himoyasi Bo‘limi';
    workbook.created = new Date();

    const sheetName = `${monthName} ${year}`;
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });

    const totalDays = monthData.totalDays;
    const totalCols = 4 + totalDays + 7;
    const lastColLetter = colLetter(totalCols);

    // Row 2: Ministry Title
    worksheet.mergeCells(`A2:${lastColLetter}2`);
    const r2 = worksheet.getCell('A2');
    r2.value = 'O‘ZBEKISTON RESPUBLIKASI QISHLOQ XO‘JALIGI VAZIRLIGI HUZURIDAGI';
    r2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
    r2.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 18;

    // Row 3: Agency Title
    worksheet.mergeCells(`A3:${lastColLetter}3`);
    const r3 = worksheet.getCell('A3');
    r3.value = 'O‘SIMLIKLAR KARANTINI VA HIMOYASI AGENTLIGI SURXONDARYO VILOYATI BANDIXON TUMANI BO‘LIMI';
    r3.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0369A1' } };
    r3.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(3).height = 22;

    // Row 4: Timesheet Title
    worksheet.mergeCells(`A4:${lastColLetter}4`);
    const r4 = worksheet.getCell('A4');
    r4.value = `${year}-YIL ${monthName.toUpperCase()} OYI UCHUN ISH VAQTI VA DAVOMAT TABELI (1 - ${totalDays} ${monthName.toUpperCase()})`;
    r4.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
    r4.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(4).height = 25;

    // Row 6 & 7: Headers
    worksheet.mergeCells('A6:A7');
    const hTr = worksheet.getCell('A6');
    hTr.value = 'T/r';

    worksheet.mergeCells('B6:B7');
    const hName = worksheet.getCell('B6');
    hName.value = 'Xodim F.I.Sh';

    worksheet.mergeCells('C6:C7');
    const hCode = worksheet.getCell('C6');
    hCode.value = 'Tabel №';

    worksheet.mergeCells('D6:D7');
    const hPos = worksheet.getCell('D6');
    hPos.value = 'Lavozimi';

    // Set header styling for basic columns
    ['A', 'B', 'C', 'D'].forEach((col) => {
      const c = worksheet.getCell(`${col}6`);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.border = BORDER_HEADER;
    });

    // Days Columns (E ..)
    for (let d = 1; d <= totalDays; d++) {
      const colIdx = 4 + d;
      const cLetter = colLetter(colIdx);
      const dayInfo = monthData.days[d - 1];
      const isWk = dayInfo ? dayInfo.isWeekend : false;
      const isHol = dayInfo ? dayInfo.isHoliday : false;

      const cellNum = worksheet.getCell(`${cLetter}6`);
      cellNum.value = d;
      cellNum.alignment = { horizontal: 'center', vertical: 'middle' };
      cellNum.border = BORDER_HEADER;

      const cellWk = worksheet.getCell(`${cLetter}7`);
      cellWk.value = dayInfo ? dayInfo.dayOfWeek : '';
      cellWk.alignment = { horizontal: 'center', vertical: 'middle' };
      cellWk.border = BORDER_HEADER;

      if (isHol) {
        const holFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFCA8A04' } };
        cellNum.fill = holFill;
        cellWk.fill = holFill;
        cellNum.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cellWk.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      } else if (isWk) {
        const wkFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF94A3B8' } };
        cellNum.fill = wkFill;
        cellWk.fill = wkFill;
        cellNum.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cellWk.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      } else {
        const defFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF0284C7' } };
        cellNum.fill = defFill;
        cellWk.fill = defFill;
        cellNum.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cellWk.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      }

      worksheet.getColumn(colIdx).width = 4.5;
    }

    // Summary headers
    const summaryHeaders = [
      { title: 'Ish kuni', width: 9 },
      { title: 'Ish soati', width: 9 },
      { title: 'Dam olish', width: 9 },
      { title: 'Javob', width: 8 },
      { title: 'Sababsiz', width: 8 },
      { title: 'Dalada', width: 8 },
      { title: 'Kasal', width: 8 },
    ];

    summaryHeaders.forEach((sh, sIdx) => {
      const colIdx = 4 + totalDays + sIdx + 1;
      const cLetter = colLetter(colIdx);

      worksheet.mergeCells(`${cLetter}6:${cLetter}7`);
      const sc = worksheet.getCell(`${cLetter}6`);
      sc.value = sh.title;
      sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      sc.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      sc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      sc.border = BORDER_HEADER;

      worksheet.getColumn(colIdx).width = sh.width;
    });

    worksheet.getRow(6).height = 20;
    worksheet.getRow(7).height = 18;

    // Set static column widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 28;

    // Data rows
    let curRow = 8;
    monthData.matrix.forEach((item: any, idx: number) => {
      const row = worksheet.getRow(curRow);
      row.height = 22;

      // Col 1: T/r
      const c1 = row.getCell(1);
      c1.value = idx + 1;
      c1.alignment = { horizontal: 'center', vertical: 'middle' };
      c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
      c1.border = BORDER_THIN;

      // Col 2: Name
      const c2 = row.getCell(2);
      c2.value = item.employee?.user?.name || item.employee?.id || '';
      c2.alignment = { horizontal: 'left', vertical: 'middle' };
      c2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      c2.border = BORDER_THIN;

      // Col 3: Employee Code
      const c3 = row.getCell(3);
      c3.value = item.employee?.employeeCode || '';
      c3.alignment = { horizontal: 'center', vertical: 'middle' };
      c3.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF0369A1' } };
      c3.border = BORDER_THIN;

      // Col 4: Position
      const c4 = row.getCell(4);
      c4.value = item.employee?.position || '';
      c4.alignment = { horizontal: 'left', vertical: 'middle' };
      c4.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
      c4.border = BORDER_THIN;

      // Day cells
      for (let d = 1; d <= totalDays; d++) {
        const colIdx = 4 + d;
        const cell = row.getCell(colIdx);
        const dayInfo = monthData.days[d - 1];
        const record = item.records[d - 1];

        const isHol = Boolean(dayInfo && dayInfo.isHoliday);
        const isWk = Boolean(dayInfo && dayInfo.isWeekend);
        const code = getCellCode(record, isHol, isWk);

        cell.value = code;
        styleAttendanceCell(cell, code, isHol, isWk);
      }

      // Summary cells
      const fieldWorkCount = item.records.filter((r: any) => r && r.status === 'FIELD_WORK').length;
      const summaries = [
        { val: item.summary?.totalWorkDays || 0, bg: 'FFDCFCE7', fg: 'FF166534', bold: true },
        { val: item.summary?.totalWorkHours || 0, bg: 'FFDCFCE7', fg: 'FF166534', bold: true },
        { val: item.summary?.totalDaysOff || 0, bg: 'FFF1F5F9', fg: 'FF475569', bold: false },
        { val: item.summary?.totalExcusedDays || 0, bg: 'FFDBEAFE', fg: 'FF1E40AF', bold: false },
        { val: item.summary?.totalAbsentDays || 0, bg: 'FFFEE2E2', fg: 'FF991B1B', bold: true },
        { val: fieldWorkCount, bg: 'FFCCFBF1', fg: 'FF0F766E', bold: false },
        { val: item.summary?.totalSickDays || 0, bg: 'FFF3E8FF', fg: 'FF6B21A8', bold: false },
      ];

      summaries.forEach((s, sIdx) => {
        const colIdx = 4 + totalDays + sIdx + 1;
        const sc = row.getCell(colIdx);
        sc.value = s.val;
        sc.alignment = { horizontal: 'center', vertical: 'middle' };
        sc.border = BORDER_THIN;
        sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.bg } };
        sc.font = { name: 'Calibri', size: 9, bold: s.bold, color: { argb: s.fg } };
      });

      curRow++;
    });

    // Legend Row
    curRow += 1;
    worksheet.mergeCells(`A${curRow}:${lastColLetter}${curRow}`);
    const rLegend = worksheet.getCell(`A${curRow}`);
    rLegend.value = 'Shartli belgilar: 8 - Ish kuni (8 soat) | D - Dam olish kuni (Shanba, Bozor) | B - Rasmiy bayram kuni | J - Ruxsat (Javob olgan) | S - Sababsiz kelmagan | X - Xizmat safari (Dalada) | K - Kasallik varaqasi';
    rLegend.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF475569' } };
    rLegend.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(curRow).height = 18;

    // Signatures Row
    curRow += 2;
    const splitCol = Math.floor(totalCols / 2);
    const splitColLetter = colLetter(splitCol);
    const nextColLetter = colLetter(splitCol + 1);

    worksheet.mergeCells(`B${curRow}:${splitColLetter}${curRow}`);
    const sig1 = worksheet.getCell(`B${curRow}`);
    sig1.value = 'Bo‘lim boshlig‘i: Bo‘riyev Shuxrat Xursandovich              (imzo) ____________________';
    sig1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    sig1.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells(`${nextColLetter}${curRow}:${lastColLetter}${curRow}`);
    const sig2 = worksheet.getCell(`${nextColLetter}${curRow}`);
    sig2.value = 'Tabelchi (Mas\'ul xodim): ____________________              (imzo) ____________________';
    sig2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    sig2.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(curRow).height = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Bandixon_Karantin_Oylik_Tabel_${year}_${monthName}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // =========================================================================
  // 2. DAILY EXPORT MODE (SOATBAY VA ANIQ DAVOMAT)
  // =========================================================================
  const date = searchParams.get('date') || getUzbekistanDateString();
  const records = storeService.getTimesheetByDate(date);
  const displayDate = date.split('-').reverse().join('.');

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const fieldWorkCount = records.filter((r) => r.status === 'FIELD_WORK').length;

  if (format === 'csv') {
    let csvContent = '\uFEFF';
    csvContent += 'T/r,Xodim F.I.Sh,Tabel raqami,Lavozimi,Holati,Kelgan vaqti,Ketgan vaqti,Ishlagan soati,Sababi/Izohi\n';
    records.forEach((r, idx) => {
      csvContent += `"${idx + 1}","${r.employeeName}","${r.employeeCode}","${r.position}","${r.status}","${r.checkInTime || ''}","${r.checkOutTime || ''}","${r.workHours}","${(r.reason || r.hourlyLog || '').replace(/"/g, '""')}"\n`;
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Bandixon_Kunlik_Tabel_${date}.csv"`,
      },
    });
  }

  // NATIVE MICROSOFT EXCEL (.xlsx) FOR DAILY TIMESHEET
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bandixon O‘simliklar Karantini va Himoyasi Bo‘limi';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`Kunlik ${displayDate}`, {
    views: [{ showGridLines: true }],
  });

  // Row 2: Ministry
  worksheet.mergeCells('A2:I2');
  const d2 = worksheet.getCell('A2');
  d2.value = 'O‘ZBEKISTON RESPUBLIKASI QISHLOQ XO‘JALIGI VAZIRLIGI HUZURIDAGI';
  d2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
  d2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3: Agency
  worksheet.mergeCells('A3:I3');
  const d3 = worksheet.getCell('A3');
  d3.value = 'O‘SIMLIKLAR KARANTINI VA HIMOYASI AGENTLIGI SURXONDARYO VILOYATI BANDIXON TUMANI BO‘LIMI';
  d3.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0369A1' } };
  d3.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 4: Title
  worksheet.mergeCells('A4:I4');
  const d4 = worksheet.getCell('A4');
  d4.value = `XODIMLARNING KUNLIK ISHGA KELDI-KETDI VA DAVOMAT TABELI (${displayDate} YIL)`;
  d4.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  d4.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 6: Table Headers
  const dailyHeaders = [
    { title: 'T/r', width: 6 },
    { title: 'Xodim F.I.Sh', width: 32 },
    { title: 'Tabel №', width: 12 },
    { title: 'Lavozimi', width: 28 },
    { title: 'Holati (Davomat)', width: 22 },
    { title: 'Kelgan vaqti', width: 14 },
    { title: 'Ketgan vaqti', width: 14 },
    { title: 'Ishlagan soati', width: 14 },
    { title: 'Sababi / Soatma-soat izohi', width: 35 },
  ];

  const hRow = worksheet.getRow(6);
  hRow.height = 24;

  dailyHeaders.forEach((dh, idx) => {
    const colIdx = idx + 1;
    const cell = hRow.getCell(colIdx);
    cell.value = dh.title;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_HEADER;
    worksheet.getColumn(colIdx).width = dh.width;
  });

  // Table Data
  let curDailyRow = 7;
  records.forEach((r, idx) => {
    const row = worksheet.getRow(curDailyRow);
    row.height = 22;

    const c1 = row.getCell(1);
    c1.value = idx + 1;
    c1.alignment = { horizontal: 'center', vertical: 'middle' };
    c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
    c1.border = BORDER_THIN;

    const c2 = row.getCell(2);
    c2.value = r.employeeName;
    c2.alignment = { horizontal: 'left', vertical: 'middle' };
    c2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    c2.border = BORDER_THIN;

    const c3 = row.getCell(3);
    c3.value = r.employeeCode;
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    c3.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF0369A1' } };
    c3.border = BORDER_THIN;

    const c4 = row.getCell(4);
    c4.value = r.position;
    c4.alignment = { horizontal: 'left', vertical: 'middle' };
    c4.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
    c4.border = BORDER_THIN;

    // Status mapping with nice colors
    const c5 = row.getCell(5);
    let statusText = 'Ishga kelgan';
    let statusBg = 'FFDCFCE7';
    let statusFg = 'FF166534';

    if (r.status === 'LATE') {
      statusText = 'Kechikib kelgan';
      statusBg = 'FFFEF9C3';
      statusFg = 'FF854D0E';
    } else if (r.status === 'EXCUSED') {
      statusText = 'Javob olgan (Ruxsat)';
      statusBg = 'FFDBEAFE';
      statusFg = 'FF1E40AF';
    } else if (r.status === 'ABSENT') {
      statusText = 'Sababsiz kelmagan';
      statusBg = 'FFFEE2E2';
      statusFg = 'FF991B1B';
    } else if (r.status === 'FIELD_WORK') {
      statusText = 'Xizmat safari (Dalada)';
      statusBg = 'FFCCFBF1';
      statusFg = 'FF0F766E';
    } else if (r.status === 'SICK_LEAVE') {
      statusText = 'Kasallik varaqasi';
      statusBg = 'FFF3E8FF';
      statusFg = 'FF6B21A8';
    } else if (r.status === 'DAY_OFF') {
      statusText = 'Dam olish kuni';
      statusBg = 'FFF1F5F9';
      statusFg = 'FF475569';
    }

    c5.value = statusText;
    c5.alignment = { horizontal: 'center', vertical: 'middle' };
    c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
    c5.font = { name: 'Calibri', size: 9, bold: true, color: { argb: statusFg } };
    c5.border = BORDER_THIN;

    const c6 = row.getCell(6);
    c6.value = r.checkInTime || '-';
    c6.alignment = { horizontal: 'center', vertical: 'middle' };
    c6.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0369A1' } };
    c6.border = BORDER_THIN;

    const c7 = row.getCell(7);
    c7.value = r.checkOutTime || '-';
    c7.alignment = { horizontal: 'center', vertical: 'middle' };
    c7.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0369A1' } };
    c7.border = BORDER_THIN;

    const c8 = row.getCell(8);
    c8.value = `${r.workHours} soat`;
    c8.alignment = { horizontal: 'center', vertical: 'middle' };
    c8.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF166534' } };
    c8.border = BORDER_THIN;

    const c9 = row.getCell(9);
    c9.value = r.reason || r.hourlyLog || '-';
    c9.alignment = { horizontal: 'left', vertical: 'middle' };
    c9.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
    c9.border = BORDER_THIN;

    curDailyRow++;
  });

  // Summary row
  curDailyRow += 1;
  worksheet.mergeCells(`A${curDailyRow}:I${curDailyRow}`);
  const dSum = worksheet.getCell(`A${curDailyRow}`);
  dSum.value = `KUNLIK STATISTIKA: Jami: ${records.length} nafar | Ishda: ${presentCount} ta | Kechikkan: ${lateCount} ta | Javob olgan: ${excusedCount} ta | Sababsiz: ${absentCount} ta | Dalada: ${fieldWorkCount} ta`;
  dSum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  dSum.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF166534' } };
  dSum.alignment = { horizontal: 'center', vertical: 'middle' };
  dSum.border = BORDER_THIN;
  worksheet.getRow(curDailyRow).height = 20;

  // Signatures
  curDailyRow += 2;
  worksheet.mergeCells(`A${curDailyRow}:D${curDailyRow}`);
  const dSig1 = worksheet.getCell(`A${curDailyRow}`);
  dSig1.value = 'Bo‘lim boshlig‘i: Bo‘riyev Shuxrat Xursandovich (imzo) ____________________';
  dSig1.font = { name: 'Calibri', size: 10, bold: true };

  worksheet.mergeCells(`F${curDailyRow}:I${curDailyRow}`);
  const dSig2 = worksheet.getCell(`F${curDailyRow}`);
  dSig2.value = 'Kadrlar / Mas\'ul xodim: ____________________ (imzo) ____________________';
  dSig2.font = { name: 'Calibri', size: 10, bold: true };
  dSig2.alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(curDailyRow).height = 25;

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Bandixon_Karantin_Kunlik_Tabel_${date}.xlsx`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
