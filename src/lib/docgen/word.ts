import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from "docx";

const PRIMARY = "2F91BE";
const INK     = "1A2430";

function parseLine(line: string): Paragraph {
  // 空行
  if (!line.trim()) {
    return new Paragraph({ text: "", spacing: { after: 60 } });
  }

  // H1
  if (line.startsWith("# ")) {
    return new Paragraph({
      children: [new TextRun({ text: line.slice(2), bold: true, size: 32, color: INK })],
      spacing: { before: 200, after: 120 },
    });
  }

  // H2
  if (line.startsWith("## ")) {
    return new Paragraph({
      children: [new TextRun({ text: line.slice(3), bold: true, size: 26, color: PRIMARY })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY } },
      spacing: { before: 180, after: 80 },
    });
  }

  // H3
  if (line.startsWith("### ")) {
    return new Paragraph({
      children: [new TextRun({ text: line.slice(4), bold: true, size: 22, color: INK })],
      spacing: { before: 120, after: 60 },
    });
  }

  // 分隔線
  if (line.startsWith("---")) {
    return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY } },
      text: "",
      spacing: { before: 80, after: 80 },
    });
  }

  // 無序列表
  if (line.match(/^[-*]\s/)) {
    return new Paragraph({
      children: [new TextRun({ text: line.slice(2), size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 40 },
    });
  }

  // 有序列表
  if (line.match(/^\d+\.\s/)) {
    return new Paragraph({
      children: [new TextRun({ text: line, size: 22 })],
      spacing: { after: 40 },
    });
  }

  // 普通段落：處理 **bold**
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  const runs = parts.map((p) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return new TextRun({ text: p.slice(2, -2), bold: true, size: 22 });
    }
    return new TextRun({ text: p, size: 22 });
  });
  return new Paragraph({ children: runs, spacing: { after: 60 } });
}

export async function generateWord(
  _title: string,
  _docType: string,
  content: string,
): Promise<Buffer> {
  const bodyParagraphs = content.split("\n").map(parseLine);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 },
          },
        },
        children: bodyParagraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
