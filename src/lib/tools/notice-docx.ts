import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, VerticalAlign,
} from "docx";

const PRIMARY = "2F91BE";
const INK     = "1A2430";
const WEEKDAYS = ["", "一", "二", "三", "四", "五", "六", "日"];

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  const wd = WEEKDAYS[dt.getDay() === 0 ? 7 : dt.getDay()];
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日（星期${wd}）`;
}

function fmtTime(t: string) {
  if (!t) return "";
  return t.replace(":", "時") + "分";
}

function cell(text: string, bold = false, shade = false): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold, size: 20 })],
    })],
    shading: shade ? { fill: "E7F1F9" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
  });
}

interface NoticeData {
  activityName: string;
  noticeNo:     string;
  issueDate:    string;
  teacher:      string;
  phone:        string;
  tutorType:    "school" | "external";
  tutorOrg:     string;
  bodyText:     string;
  sessions:     { date: string; startTime: string; endTime: string; arrivalTime: string; location: string }[];
  students:     { classCode: string; studentId: string; name: string }[];
}

export async function generateNoticeDocx(data: NoticeData): Promise<Buffer> {
  const sessionRows = data.sessions.map((s, i) =>
    new TableRow({
      children: [
        cell(`第 ${i + 1} 節`, true, true),
        cell(fmtDate(s.date)),
        cell(`${fmtTime(s.startTime)} — ${fmtTime(s.endTime)}`),
        cell(fmtTime(s.arrivalTime)),
        cell(s.location),
      ],
    })
  );

  const studentRows = data.students.filter((s) => s.name).map((s) =>
    new TableRow({
      children: [cell(s.classCode), cell(s.studentId), cell(s.name)],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 1080, right: 1080 } } },
      children: [
        // 校名
        new Paragraph({
          children: [new TextRun({ text: "基督教香港崇真會基智中學", bold: true, size: 32, color: PRIMARY })],
          alignment: AlignmentType.CENTER, spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Keichi Secondary School", size: 18, color: "7A8694" })],
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
        }),
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY } },
          text: "", spacing: { after: 200 },
        }),

        // 通告標題
        new Paragraph({
          children: [new TextRun({ text: data.activityName, bold: true, size: 28, color: INK })],
          alignment: AlignmentType.CENTER, spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `家長通告${data.noticeNo ? "　" + data.noticeNo : ""}`, size: 22, color: "7A8694" })],
          alignment: AlignmentType.CENTER, spacing: { after: 280 },
        }),

        // 稱謂
        new Paragraph({ children: [new TextRun({ text: "親愛的家長：", size: 22 })], spacing: { after: 120 } }),

        // 正文
        new Paragraph({ children: [new TextRun({ text: data.bodyText, size: 22 })], spacing: { after: 200 } }),

        // 活動節次表
        new Paragraph({ children: [new TextRun({ text: "活動詳情", bold: true, size: 22, color: PRIMARY })], spacing: { before: 120, after: 80 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [cell("節次", true, true), cell("日期", true, true), cell("時間", true, true), cell("到達時間", true, true), cell("地點", true, true)],
            }),
            ...sessionRows,
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 120 } }),

        // 學生名單
        ...(studentRows.length > 0 ? [
          new Paragraph({ children: [new TextRun({ text: "參與學生名單", bold: true, size: 22, color: PRIMARY })], spacing: { before: 120, after: 80 } }),
          new Table({
            width: { size: 60, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ tableHeader: true, children: [cell("班別", true, true), cell("學號", true, true), cell("姓名", true, true)] }),
              ...studentRows,
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 120 } }),
        ] : []),

        // 負責老師
        new Paragraph({ children: [new TextRun({ text: `負責老師：${data.teacher}　　聯絡電話：${data.phone}`, size: 20 })], spacing: { before: 200, after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: `發出日期：${fmtDate(data.issueDate)}`, size: 20, color: "7A8694" })], spacing: { after: 280 } }),

        // 回條
        new Paragraph({
          border: { top: { style: BorderStyle.DASHED, size: 1, color: "AAAAAA" } },
          text: "",
          spacing: { before: 200, after: 120 },
        }),
        new Paragraph({ children: [new TextRun({ text: "家長回條", bold: true, size: 22, color: PRIMARY })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: `本人同意 / 不同意 貴子弟參加「${data.activityName}」。`, size: 20 })], spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: "家長/監護人簽名：___________________　　日期：___________________", size: 20 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: "學生姓名：___________________　　班別：___________________", size: 20 })], spacing: { after: 40 } }),

        // 頁腳
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY } },
          children: [new TextRun({ text: "基智 · KCSS", size: 14, color: "B84030" })],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 400 },
        }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

export async function generateTutorSignIn(data: NoticeData): Promise<Buffer> {
  const sessionRows = data.sessions.map((s, i) =>
    new TableRow({
      children: [
        cell(`${i + 1}`, false, true),
        cell(fmtDate(s.date)),
        cell(`${fmtTime(s.startTime)} — ${fmtTime(s.endTime)}`),
        cell(s.location),
        cell(""),  // 簽名
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 1080, right: 1080 } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "基督教香港崇真會基智中學 — 導師簽到表", bold: true, size: 28, color: PRIMARY })],
          alignment: AlignmentType.CENTER, spacing: { after: 60 },
        }),
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY } },
          text: "", spacing: { after: 180 },
        }),
        new Paragraph({ children: [new TextRun({ text: `活動名稱：${data.activityName}`, size: 22 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: `導師/機構：${data.tutorOrg}　　負責老師：${data.teacher}`, size: 22 })], spacing: { after: 180 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ tableHeader: true, children: [cell("節", true, true), cell("日期", true, true), cell("時間", true, true), cell("地點", true, true), cell("導師簽名", true, true)] }),
            ...sessionRows,
          ],
        }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}
