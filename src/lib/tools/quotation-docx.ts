import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, VerticalAlign,
} from "docx";

const PRIMARY = "2F91BE";
const METHODS: Record<string, string> = { phone: "電話", fax: "傳真", mail: "親身送遞", other: "其他" };
const CATS:    Record<string, string> = { fixed: "固定資產", consumable: "消耗品", other: "其他" };
const WEEKDAYS = ["日","一","二","三","四","五","六"];

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日（星期${WEEKDAYS[dt.getDay()]}）`;
}

function hdrCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
    shading:  { fill: "E7F1F9" },
    margins:  { top: 60, bottom: 60, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
  });
}
function dataCell(text: string, shade = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 18 })], alignment: AlignmentType.CENTER })],
    shading:  shade ? { fill: "F0F8FF" } : undefined,
    margins:  { top: 60, bottom: 60, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
  });
}

interface QuotationData {
  quoteDate:    string;
  quoteMethod:  string;
  higherReason: string;
  fewerReason:  string;
  batchName:    string;
  items:        { name: string; qty: string }[];
  suppliers:    { name: string; phone: string; prices: string[]; recommended: boolean }[];
  category:     string;
  dept:         string;
  purpose:      string;
  deliveryDate: string;
  funding:      string;
  requesterName:  string;
  requesterRank:  string;
  requesterDate:  string;
  deptHeadName:   string;
  deptHeadRank:   string;
  deptHeadDate:   string;
}

export async function generateQuotationDocx(d: QuotationData): Promise<Buffer> {
  const recIdx  = d.suppliers.findIndex((s) => s.recommended);
  const recName = recIdx >= 0 ? d.suppliers[recIdx].name : "";

  const itemRows = d.items.map((item, i) => {
    const prices = d.suppliers.map((s) => {
      const p = parseFloat(s.prices[i] ?? "0") || 0;
      const q = parseFloat(item.qty) || 0;
      return `$${(p * q).toFixed(2)}`;
    });
    return new TableRow({
      children: [
        dataCell(`${i + 1}. ${item.name}\n數量：${item.qty}`),
        ...prices.map((p, si) => dataCell(p, d.suppliers[si].recommended)),
      ],
    });
  });

  // 合計行
  const totals = d.suppliers.map((s) => {
    const t = s.prices.reduce((sum, p, i) => {
      const q = parseFloat(d.items[i]?.qty ?? "0") || 0;
      return sum + (parseFloat(p) || 0) * q;
    }, 0);
    return `$${t.toFixed(2)}`;
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 800, bottom: 800, left: 1000, right: 1000 } } },
      children: [
        // 標題
        new Paragraph({
          children: [new TextRun({ text: "基督教香港崇真會基智中學", bold: true, size: 28, color: PRIMARY })],
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "按口頭報價採購表格　Verbal Quotation Form", bold: true, size: 24 })],
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
        }),
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY } },
          text: "", spacing: { after: 160 },
        }),

        // 基本資料
        new Paragraph({ children: [new TextRun({ text: `報價日期：${fmtDate(d.quoteDate)}　　報價方式：${METHODS[d.quoteMethod] ?? d.quoteMethod}`, size: 20 })], spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: `採購名稱：${d.batchName}`, size: 20, bold: true })], spacing: { after: 60 } }),
        ...(d.higherReason ? [new Paragraph({ children: [new TextRun({ text: `選用較高價格原因：${d.higherReason}`, size: 18, color: "7A8694" })], spacing: { after: 40 } })] : []),
        ...(d.fewerReason  ? [new Paragraph({ children: [new TextRun({ text: `供應商少於三間原因：${d.fewerReason}`, size: 18, color: "7A8694" })], spacing: { after: 40 } })] : []),
        new Paragraph({ text: "", spacing: { after: 80 } }),

        // 報價比較表
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                hdrCell("物品名稱/規格"),
                ...d.suppliers.map((s, i) =>
                  hdrCell(`供應商 ${String.fromCharCode(65 + i)}${s.recommended ? "（建議）" : ""}\n${s.name || "-"}\n${s.phone || ""}`)
                ),
              ],
            }),
            ...itemRows,
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "合計", bold: true, size: 18 })] })], shading: { fill: "E7F1F9" }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
                ...totals.map((t, si) => dataCell(t, d.suppliers[si].recommended)),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 120 } }),

        // 建議採用
        new Paragraph({ children: [new TextRun({ text: `建議採用供應商：${recName}`, size: 20, bold: true, color: PRIMARY })], spacing: { after: 60 } }),

        // 採購詳情
        new Paragraph({ children: [new TextRun({ text: `採購類別：${CATS[d.category] ?? d.category}　　部門/科組：${d.dept}`, size: 20 })], spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: `用途/安放地點：${d.purpose}`, size: 20 })], spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: `交貨日期：${fmtDate(d.deliveryDate)}　　資金來源：${d.funding}`, size: 20 })], spacing: { after: 160 } }),

        // 簽署表
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [hdrCell("申請人"), hdrCell("科主任/部門主管")],
            }),
            new TableRow({
              height: { value: 800, rule: "atLeast" },
              children: [
                dataCell(`姓名：${d.requesterName}\n職級：${d.requesterRank}\n日期：${fmtDate(d.requesterDate)}\n\n簽名：`),
                dataCell(`姓名：${d.deptHeadName}\n職級：${d.deptHeadRank}\n日期：${fmtDate(d.deptHeadDate)}\n\n簽名：`),
              ],
            }),
          ],
        }),

        // 頁腳
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY } },
          children: [new TextRun({ text: "基智 · KCSS", size: 14, color: "B84030" })],
          alignment: AlignmentType.RIGHT,
          spacing:   { before: 300 },
        }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}
