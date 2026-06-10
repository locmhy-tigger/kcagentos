import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

const PRIMARY  = "#2F91BE";
const SEAL     = "#B84030";
const INK      = "#1A2430";
const INK2     = "#44505E";
const INK3     = "#7A8694";
const styles = StyleSheet.create({
  page: {
    paddingTop:    56,
    paddingBottom: 56,
    paddingLeft:   60,
    paddingRight:  60,
    fontFamily:    "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  headerSchool: {
    fontSize:    16,
    fontWeight:  "bold",
    color:       PRIMARY,
    textAlign:   "center",
    marginBottom: 4,
  },
  headerSub: {
    fontSize:  9,
    color:     INK3,
    textAlign: "center",
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    marginBottom: 20,
  },
  docTitle: {
    fontSize:    20,
    fontWeight:  "bold",
    color:       INK,
    textAlign:   "center",
    marginBottom: 4,
  },
  docType: {
    fontSize:  9,
    color:     INK3,
    textAlign: "center",
    marginBottom: 24,
  },
  h1: {
    fontSize:    16,
    fontWeight:  "bold",
    color:       PRIMARY,
    marginTop:   14,
    marginBottom: 6,
  },
  h2: {
    fontSize:    13,
    fontWeight:  "bold",
    color:       PRIMARY,
    marginTop:   12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
    paddingBottom: 2,
  },
  h3: {
    fontSize:    11,
    fontWeight:  "bold",
    color:       INK,
    marginTop:   8,
    marginBottom: 3,
  },
  body: {
    fontSize:     10,
    color:        INK2,
    lineHeight:   1.7,
    marginBottom: 4,
  },
  bullet: {
    fontSize:    10,
    color:       INK2,
    lineHeight:  1.7,
    marginLeft:  12,
    marginBottom: 2,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
    marginVertical:    10,
  },
  footer: {
    position:   "absolute",
    bottom:     30,
    right:      60,
    fontSize:   8,
    color:      SEAL,
    fontStyle:  "normal",
  },
  stamp: {
    position:     "absolute",
    top:          52,
    right:        52,
    borderWidth:  1,
    borderColor:  SEAL,
    paddingVertical:   3,
    paddingHorizontal: 6,
    fontSize:     7,
    color:        SEAL,
  },
});

function renderLine(line: string, idx: number) {
  if (!line.trim()) return <Text key={idx} style={{ fontSize: 6 }}>{" "}</Text>;
  if (line.startsWith("# "))  return <Text key={idx} style={styles.h1}>{line.slice(2)}</Text>;
  if (line.startsWith("## ")) return <Text key={idx} style={styles.h2}>{line.slice(3)}</Text>;
  if (line.startsWith("### "))return <Text key={idx} style={styles.h3}>{line.slice(4)}</Text>;
  if (line.startsWith("---")) return <View key={idx} style={styles.sectionDivider} />;
  if (line.match(/^[-*]\s/))  return <Text key={idx} style={styles.bullet}>• {line.slice(2)}</Text>;
  if (line.match(/^\d+\.\s/)) return <Text key={idx} style={styles.bullet}>{line}</Text>;

  // 處理 bold **text**
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text key={idx} style={styles.body}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <Text key={i} style={{ fontWeight: "bold" }}>{p.slice(2, -2)}</Text>
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
        {/* 印章 */}
        <View style={styles.stamp} fixed>
          <Text>基智 · KCSS</Text>
        </View>

        {/* 學校抬頭 */}
        <Text style={styles.headerSchool}>基督教香港崇真會基智中學</Text>
        <Text style={styles.headerSub}>Keichi Secondary School · {docType}</Text>
        <View style={styles.divider} />

        {/* 文件標題 */}
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docType}>{docType}</Text>

        {/* 正文 */}
        {lines.map((line, i) => renderLine(line, i))}

        {/* 頁腳 */}
        <Text style={styles.footer} fixed>
          基智 · KCSS
        </Text>
      </Page>
    </Document>
  );
}

export async function generatePDF(
  title: string,
  docType: string,
  content: string,
): Promise<Buffer> {
  const element = <KCSSDocument title={title} docType={docType} content={content} />;
  const instance = pdf(element);
  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
