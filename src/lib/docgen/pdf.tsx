import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import path from "path";

// 嵌入 Noto Sans TC 字體 — 解決中文亂碼
const fontsDir = path.join(process.cwd(), "public", "fonts");
Font.register({
  family: "NotoSansTC",
  fonts: [
    { src: path.join(fontsDir, "NotoSansTC-Regular.otf"), fontWeight: 400 },
    { src: path.join(fontsDir, "NotoSansTC-Bold.otf"),    fontWeight: 700 },
  ],
});

const PRIMARY = "#2F91BE";
const SEAL    = "#B84030";
const INK     = "#1A2430";
const INK2    = "#44505E";
const INK3    = "#7A8694";

const styles = StyleSheet.create({
  page: {
    paddingTop:    56,
    paddingBottom: 64,
    paddingLeft:   64,
    paddingRight:  64,
    fontFamily:    "NotoSansTC",
    backgroundColor: "#FFFFFF",
  },
  // 學校抬頭
  headerSchool: {
    fontSize:    14,
    fontWeight:  700,
    color:       PRIMARY,
    textAlign:   "center",
    marginBottom: 3,
  },
  headerSub: {
    fontSize:    8,
    color:       INK3,
    textAlign:   "center",
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: PRIMARY,
    marginBottom: 16,
  },
  // 文件標題
  docTitle: {
    fontSize:    18,
    fontWeight:  700,
    color:       INK,
    textAlign:   "center",
    marginBottom: 16,
  },
  // 正文樣式
  h1: {
    fontSize:    14,
    fontWeight:  700,
    color:       INK,
    marginTop:   12,
    marginBottom: 6,
  },
  h2: {
    fontSize:    12,
    fontWeight:  700,
    color:       PRIMARY,
    marginTop:   10,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: PRIMARY,
    paddingBottom: 2,
  },
  h3: {
    fontSize:    10,
    fontWeight:  700,
    color:       INK,
    marginTop:   8,
    marginBottom: 3,
  },
  body: {
    fontSize:    10,
    color:       INK2,
    lineHeight:  1.8,
    marginBottom: 4,
  },
  bullet: {
    fontSize:    10,
    color:       INK2,
    lineHeight:  1.8,
    marginLeft:  14,
    marginBottom: 2,
  },
  sectionDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: PRIMARY,
    marginVertical:    8,
  },
  // 頁首印章（每頁固定）
  stamp: {
    position:          "absolute",
    top:               20,
    right:             52,
    borderWidth:       0.8,
    borderColor:       SEAL,
    paddingVertical:   2,
    paddingHorizontal: 5,
    fontSize:          7,
    color:             SEAL,
  },
  // 頁腳（每頁固定）
  footer: {
    position:  "absolute",
    bottom:    20,
    right:     52,
    fontSize:  7,
    color:     INK3,
  },
});

function renderLine(line: string, idx: number): React.ReactElement {
  if (!line.trim()) {
    return <Text key={idx} style={{ fontSize: 5 }}>{" "}</Text>;
  }
  if (line.startsWith("# ")) {
    return <Text key={idx} style={styles.h1}>{line.slice(2)}</Text>;
  }
  if (line.startsWith("## ")) {
    return <Text key={idx} style={styles.h2}>{line.slice(3)}</Text>;
  }
  if (line.startsWith("### ")) {
    return <Text key={idx} style={styles.h3}>{line.slice(4)}</Text>;
  }
  if (line.startsWith("---")) {
    return <View key={idx} style={styles.sectionDivider} />;
  }
  if (line.match(/^[-*]\s/)) {
    return <Text key={idx} style={styles.bullet}>• {line.slice(2)}</Text>;
  }
  if (line.match(/^\d+\.\s/)) {
    return <Text key={idx} style={styles.bullet}>{line}</Text>;
  }

  // 普通段落：處理 **bold**
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text key={idx} style={styles.body}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <Text key={i} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

interface DocProps {
  title:   string;
  docType: string;
  content: string;
}

function KCSSDocument({ title, docType, content }: DocProps) {
  const lines = content.split("\n");
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 右上印章（每頁） */}
        <View style={styles.stamp} fixed>
          <Text>基智 · KCSS</Text>
        </View>

        {/* 學校抬頭 */}
        <Text style={styles.headerSchool}>基督教香港崇真會基智中學</Text>
        <Text style={styles.headerSub}>Keichi Secondary School · {docType}</Text>
        <View style={styles.divider} />

        {/* 文件標題 */}
        <Text style={styles.docTitle}>{title}</Text>

        {/* 正文 */}
        {lines.map((line, i) => renderLine(line, i))}

        {/* 頁腳（每頁） */}
        <Text style={styles.footer} fixed>基智 · KCSS</Text>
      </Page>
    </Document>
  );
}

export async function generatePDF(
  title:   string,
  docType: string,
  content: string,
): Promise<Buffer> {
  const element  = <KCSSDocument title={title} docType={docType} content={content} />;
  const instance = pdf(element);
  const blob     = await instance.toBlob();
  return Buffer.from(await blob.arrayBuffer());
}
