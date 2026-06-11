import ExcelJS from "exceljs";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const FAD8_CATS: Record<string, string> = {
  "1": "獎項／比賽",
  "2": "藝術表演",
  "3": "領袖／服務",
  "4": "體育",
  "5": "制服團體",
  "6": "工作體驗",
};

function fmtDateShort(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}（${WEEKDAYS[dt.getDay()]}）`;
}

interface NoticeData {
  activityName: string;
  issueDate:    string;
  teacher:      string;
  tutorType:    string;
  tutorOrg:     string;
  sessions:     { date: string; startTime: string; endTime: string; location: string }[];
  students:     { classCode: string; studentId: string; name: string }[];
  fad8Cat:      string;
  dept:         string;
}

export async function generateAttendanceXlsx(data: NoticeData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("出席紀錄");

  // 標題列
  ws.mergeCells("A1:B1");
  ws.getCell("A1").value = `活動名稱：${data.activityName}`;
  ws.getCell("A1").font  = { bold: true, size: 12 };

  ws.mergeCells("C1:D1");
  ws.getCell("C1").value = `負責老師：${data.teacher}`;
  ws.getCell("C1").font  = { size: 11 };

  // 日期標題行（每節一欄）
  const headerRow = ["班別", "學號", "姓名", ...data.sessions.map((s) => fmtDateShort(s.date))];
  const hRow = ws.addRow(headerRow);
  hRow.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F1F9" } };
    cell.font   = { bold: true, size: 10 };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // 學生行
  data.students.filter((s) => s.name).forEach((s) => {
    const row = ws.addRow([s.classCode, s.studentId, s.name, ...data.sessions.map(() => "")]);
    row.eachCell((cell) => {
      cell.border    = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    row.height = 20;
  });

  // 欄寬
  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 10;
  ws.getColumn(3).width = 14;
  for (let i = 4; i < 4 + data.sessions.length; i++) ws.getColumn(i).width = 14;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function generateFad8Xlsx(data: NoticeData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("FAD8學生學習紀錄");

  // 標題
  ws.mergeCells("A1:F1");
  ws.getCell("A1").value = "學生學習紀錄（FAD8）";
  ws.getCell("A1").font  = { bold: true, size: 14, color: { argb: "FF2F91BE" } };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.mergeCells("A2:F2");
  ws.getCell("A2").value = `活動：${data.activityName}　　類別：${FAD8_CATS[data.fad8Cat] ?? data.fad8Cat}　　科組：${data.dept}`;
  ws.getCell("A2").font  = { size: 10 };

  ws.addRow([]);

  const hRow = ws.addRow(["班別", "學號", "姓名", "活動名稱", "類別", "科組"]);
  hRow.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F1F9" } };
    cell.font   = { bold: true, size: 10 };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    cell.alignment = { horizontal: "center" };
  });

  data.students.filter((s) => s.name).forEach((s) => {
    const row = ws.addRow([
      s.classCode, s.studentId, s.name,
      data.activityName, FAD8_CATS[data.fad8Cat] ?? data.fad8Cat, data.dept,
    ]);
    row.eachCell((cell) => {
      cell.border    = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    row.height = 20;
  });

  [8, 10, 14, 24, 14, 14].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
