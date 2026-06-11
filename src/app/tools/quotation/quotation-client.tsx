"use client";

import { useState } from "react";

interface Item   { name: string; qty: string }
interface Supplier { name: string; phone: string; prices: string[]; recommended: boolean }

const DEPTS = ["中文科","英文科","數學科","通識科","物理科","化學科","生物科","體育科","視藝科","音樂科","ICT 科","歷史科","地理科","經濟科","德育及公民教育","課外活動組","圖書館","校務處"];

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border2)", borderRadius: 4, padding: "7px 10px",
  fontSize: 13, fontFamily: "var(--sans)", color: "var(--ink)",
  background: "var(--bg)", width: "100%", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: "var(--mono)", color: "var(--primary-dark)",
  textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 4, display: "block",
};
const sectionStyle: React.CSSProperties = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 5, padding: "20px 22px", marginBottom: 16,
  boxShadow: "2px 2px 0 var(--primary-light)",
};
const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
  color: "var(--primary)", textTransform: "uppercase" as const,
  letterSpacing: 1, marginBottom: 14,
  paddingLeft: 8, borderLeft: "3px solid var(--primary)",
};

export default function QuotationClient() {
  const today = new Date().toISOString().split("T")[0];
  const [quoteDate,    setQuoteDate]    = useState(today);
  const [quoteMethod,  setQuoteMethod]  = useState("phone");
  const [higherReason, setHigherReason] = useState("");
  const [fewerReason,  setFewerReason]  = useState("");
  const [batchName,    setBatchName]    = useState("");
  const [items,        setItems]        = useState<Item[]>([{ name: "", qty: "" }]);
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([
    { name: "", phone: "", prices: [""], recommended: true  },
    { name: "", phone: "", prices: [""], recommended: false },
  ]);
  const [category,     setCategory]     = useState("consumable");
  const [dept,         setDept]         = useState("");
  const [purpose,      setPurpose]      = useState("");
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [funding,      setFunding]      = useState("");
  const [requesterName,  setRequesterName]  = useState("");
  const [requesterRank,  setRequesterRank]  = useState("");
  const [requesterDate,  setRequesterDate]  = useState(today);
  const [deptHeadName,   setDeptHeadName]   = useState("");
  const [deptHeadRank,   setDeptHeadRank]   = useState("");
  const [deptHeadDate,   setDeptHeadDate]   = useState(today);
  const [loading,      setLoading]      = useState(false);

  function addItem() {
    if (items.length >= 3) return;
    const newItems = [...items, { name: "", qty: "" }];
    setItems(newItems);
    setSuppliers((s) => s.map((sup) => ({ ...sup, prices: [...sup.prices, ""] })));
  }
  function removeItem(i: number) {
    setItems((it) => it.filter((_, idx) => idx !== i));
    setSuppliers((s) => s.map((sup) => ({ ...sup, prices: sup.prices.filter((_, idx) => idx !== i) })));
  }
  function updateItem(i: number, field: keyof Item, val: string) {
    setItems((it) => it.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  }
  function updateSupplier(si: number, field: keyof Omit<Supplier, "prices" | "recommended">, val: string) {
    setSuppliers((s) => s.map((row, idx) => idx === si ? { ...row, [field]: val } : row));
  }
  function updatePrice(si: number, ii: number, val: string) {
    setSuppliers((s) => s.map((row, idx) => idx === si ? { ...row, prices: row.prices.map((p, pi) => pi === ii ? val : p) } : row));
  }
  function setRecommended(si: number) {
    setSuppliers((s) => s.map((row, idx) => ({ ...row, recommended: idx === si })));
  }
  function calcTotal(si: number) {
    const sup = suppliers[si];
    const total = sup.prices.reduce((sum, p, i) => {
      const qty = parseFloat(items[i]?.qty ?? "0") || 0;
      return sum + (parseFloat(p) || 0) * qty;
    }, 0);
    return total.toFixed(2);
  }

  async function handleGenerate() {
    if (!batchName || !requesterName || !dept) {
      alert("請填寫報價名稱、申請人及部門。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tools/quotation/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ quoteDate, quoteMethod, higherReason, fewerReason, batchName, items, suppliers, category, dept, purpose, deliveryDate, funding, requesterName, requesterRank, requesterDate, deptHeadName, deptHeadRank, deptHeadDate }),
      });
      if (!res.ok) throw new Error("生成失敗");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${batchName}_報價表.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("生成失敗，請再試。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sans)" }}>
      {/* 頁首 */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 0 var(--primary-light)" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: "var(--seal)", color: "#fff", fontFamily: "var(--serif)", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0 var(--primary-light)" }}>智</div>
          <span style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--ink2)" }}>基智 Agent OS</span>
        </a>
        <span style={{ color: "var(--ink3)" }}>›</span>
        <span style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>按口頭報價採購表格</span>
        <div style={{ marginLeft: "auto", fontSize: 9, fontFamily: "var(--mono)", color: "var(--seal)", border: "1px solid var(--seal)", padding: "2px 7px", borderRadius: 2 }}>基智 · KCSS</div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 100px" }}>

        {/* ① 採購資料 */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>① 採購資料</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>報價日期</label>
              <input style={inputStyle} type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>報價方式</label>
              <div style={{ display: "flex", gap: 16, paddingTop: 8, flexWrap: "wrap" }}>
                {[["phone","電話"],["fax","傳真"],["mail","親身送遞"],["other","其他"]].map(([v, l]) => (
                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--ink2)", cursor: "pointer" }}>
                    <input type="radio" value={v} checked={quoteMethod === v} onChange={() => setQuoteMethod(v)} />{l}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>報價名稱/批次 *</label>
              <input style={inputStyle} value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="例：2025-26 年度美術材料採購" required />
            </div>
            <div>
              <label style={labelStyle}>採購類別</label>
              <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="fixed">固定資產</option>
                <option value="consumable">消耗品</option>
                <option value="other">其他</option>
              </select>
            </div>
            {higherReason !== undefined && (
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>選用較高價格原因（如適用）</label>
                <input style={inputStyle} value={higherReason} onChange={(e) => setHigherReason(e.target.value)} placeholder="留空表示不適用" />
              </div>
            )}
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>供應商少於三間原因（如適用）</label>
              <input style={inputStyle} value={fewerReason} onChange={(e) => setFewerReason(e.target.value)} placeholder="留空表示不適用" />
            </div>
          </div>
        </div>

        {/* ② 採購物品 */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={sectionTitle}>② 採購物品（最多 3 項）</div>
            {items.length < 3 && <button onClick={addItem} style={{ fontSize: 12, padding: "4px 12px", background: "var(--primary-light)", border: "1px solid var(--border2)", borderRadius: 3, cursor: "pointer", color: "var(--primary-dark)", fontFamily: "var(--sans)" }}>＋ 加物品</button>}
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, marginBottom: 8, alignItems: "end" }}>
              <div>
                <label style={labelStyle}>物品名稱/規格 {i + 1}</label>
                <input style={inputStyle} value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="物品名稱及規格" />
              </div>
              <div>
                <label style={labelStyle}>數量</label>
                <input style={inputStyle} type="number" min="1" value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} placeholder="數量" />
              </div>
              {items.length > 1 && <button onClick={() => removeItem(i)} style={{ padding: "7px 10px", background: "none", border: "1px solid var(--seal)", borderRadius: 4, color: "var(--seal)", cursor: "pointer", fontSize: 13 }}>×</button>}
            </div>
          ))}
        </div>

        {/* ③ 供應商報價 */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>③ 供應商報價</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {suppliers.map((sup, si) => (
              <div key={si} style={{ background: sup.recommended ? "rgba(47,145,190,0.06)" : "var(--bg2)", border: `1px solid ${sup.recommended ? "var(--primary)" : "var(--border)"}`, borderRadius: 4, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink3)" }}>供應商 {String.fromCharCode(65 + si)}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--primary)", cursor: "pointer" }}>
                    <input type="radio" checked={sup.recommended} onChange={() => setRecommended(si)} />建議採用
                  </label>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>公司名稱{si === 0 ? " *" : ""}</label>
                  <input style={inputStyle} value={sup.name} onChange={(e) => updateSupplier(si, "name", e.target.value)} placeholder="供應商名稱" />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>電話</label>
                  <input style={inputStyle} value={sup.phone} onChange={(e) => updateSupplier(si, "phone", e.target.value)} placeholder="聯絡電話" />
                </div>
                {items.map((item, ii) => (
                  <div key={ii} style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>物品 {ii + 1} 單價（HK$）</label>
                    <input style={inputStyle} type="number" min="0" step="0.01" value={sup.prices[ii] ?? ""} onChange={(e) => updatePrice(si, ii, e.target.value)} placeholder="0.00" />
                  </div>
                ))}
                <div style={{ textAlign: "right", fontSize: 12, color: "var(--primary)", fontWeight: 600, marginTop: 6 }}>
                  合計：HK$ {calcTotal(si)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ④ 採購詳情 */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>④ 採購詳情</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>部門/科組 *</label>
              <input style={inputStyle} value={dept} onChange={(e) => setDept(e.target.value)} list="dept-list" required />
              <datalist id="dept-list">{DEPTS.map((d) => <option key={d} value={d} />)}</datalist>
            </div>
            <div>
              <label style={labelStyle}>交貨日期</label>
              <input style={inputStyle} type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>用途/安放地點 *</label>
              <input style={inputStyle} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="例：供 ICT 室電腦使用" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>資金來源</label>
              <input style={inputStyle} value={funding} onChange={(e) => setFunding(e.target.value)} placeholder="例：學校一般經費" />
            </div>
          </div>
        </div>

        {/* ⑤ 簽署 */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>⑤ 簽署</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 4, padding: 14 }}>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink3)", marginBottom: 10 }}>申請人</div>
              {[["申請人姓名 *", requesterName, setRequesterName], ["職級", requesterRank, setRequesterRank]].map(([l, v, fn]) => (
                <div key={l as string} style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>{l as string}</label>
                  <input style={inputStyle} value={v as string} onChange={(e) => (fn as (v: string) => void)(e.target.value)} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>日期</label>
                <input style={inputStyle} type="date" value={requesterDate} onChange={(e) => setRequesterDate(e.target.value)} />
              </div>
            </div>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 4, padding: 14 }}>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink3)", marginBottom: 10 }}>科主任/部門主管</div>
              {[["姓名", deptHeadName, setDeptHeadName], ["職級", deptHeadRank, setDeptHeadRank]].map(([l, v, fn]) => (
                <div key={l as string} style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>{l as string}</label>
                  <input style={inputStyle} value={v as string} onChange={(e) => (fn as (v: string) => void)(e.target.value)} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>日期</label>
                <input style={inputStyle} type="date" value={deptHeadDate} onChange={(e) => setDeptHeadDate(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按鈕 */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--card)", borderTop: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -2px 0 var(--primary-light)" }}>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>生成：{batchName || "採購名稱"}_報價表.docx</div>
        <button onClick={handleGenerate} disabled={loading} style={{ padding: "10px 28px", background: loading ? "var(--ink3)" : "var(--primary)", color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer", fontFamily: "var(--sans)", boxShadow: "2px 2px 0 var(--primary-light)" }}>
          {loading ? "生成中…" : "⬇ 生成 DOCX"}
        </button>
      </div>
    </div>
  );
}
