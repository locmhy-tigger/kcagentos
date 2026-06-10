import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

const PRIMARY_COLOR = "2F91BE";
const SEAL_COLOR    = "B84030";
const INK_COLOR     = "1A2430";

function parseMarkdownToDocx(markdown: string): Paragraph[] {
  const lines = markdown.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    // H1
    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: line.slice(2),
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: line.slice(2), bold: true, color: PRIMARY_COLOR, size: 36 })],
        }),
      );
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.slice(3), bold: true, color: PRIMARY_COLOR, size: 28 })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR } },
          spacing: { before: 240, after: 120 },
        }),
      );
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.slice(4), bold: true, size: 24 })],
          spacing: { before: 200, after: 80 },
        }),
      );
      continue;
    }

    // 分隔線
    if (line.startsWith("---")) {
      paragraphs.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR } },
          text: "",
          spacing: { before: 120, after: 120 },
        }),
      );
      continue;
    }

    // 列表
    if (line.match(/^[-*]\s/)) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.slice(2), size: 22 })],
          bullet: { level: 0 },
        }),
      );
      continue;
    }

    // 有序列表
    if (line.match(/^\d+\.\s/)) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/^\d+\.\s/, ""), size: 22 })],
          numbering: { reference: "ordered-list", level: 0 },
        }),
      );
      continue;
    }

    // 普通段落，處理 **bold** 及 *italic*
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const runs = parts.map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return new TextRun({ text: part.slice(2, -2), bold: true, size: 22 });
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return new TextRun({ text: part.slice(1, -1), italics: true, size: 22 });
      }
      return new TextRun({ text: part, size: 22 });
    });

    paragraphs.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
  }

  return paragraphs;
}

export async function generateWord(
  title: string,
  docType: string,
  content: string,
): Promise<Buffer> {
  const bodyParagraphs = parseMarkdownToDocx(content);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
          },
        },
        children: [
          // 學校抬頭
          new Paragraph({
            children: [
              new TextRun({
                text: "基督教香港崇真會基智中學",
                bold: true,
                size: 32,
                color: PRIMARY_COLOR,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "KCSS · Keichi Secondary School",
                size: 20,
                color: "7A8694",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
          // 主藍分隔線
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: PRIMARY_COLOR } },
            text: "",
            spacing: { after: 240 },
          }),
          // 文件標題
          new Paragraph({
            children: [
              new TextRun({ text: title, bold: true, size: 36, color: INK_COLOR }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          // 文件類型標籤
          new Paragraph({
            children: [
              new TextRun({ text: docType, size: 18, color: "7A8694", font: "DM Mono" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),
          ...bodyParagraphs,
          // 底部印章
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR } },
            children: [
              new TextRun({ text: "基智 · KCSS", size: 16, color: SEAL_COLOR, font: "DM Mono" }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 480 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
