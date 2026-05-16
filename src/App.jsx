import { useState, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const TYPES = [
  { value: "income",  label: "Income",         icon: "↑", color: "#4ade80" },
  { value: "expense", label: "Expense",         icon: "↓", color: "#f87171" },
  { value: "fund",    label: "Fund / Savings",  icon: "◆", color: "#60a5fa" },
];

const CADENCES = [
  { value: "weekly",      label: "Weekly",        sub: "every week",      multiplier: 4.333 },
  { value: "biweekly",   label: "Bi-weekly",     sub: "every 2 weeks",   multiplier: 2.167 },
  { value: "semimonthly",label: "Twice a month", sub: "1st & 15th",      multiplier: 2     },
  { value: "monthly",    label: "Monthly",       sub: "once a month",    multiplier: 1     },
  { value: "quarterly",  label: "Quarterly",     sub: "every 3 months",  multiplier: 1/3   },
  { value: "annual",     label: "Annual",        sub: "once a year",     multiplier: 1/12  },
];

const EXPENSE_CATEGORIES = [
  { value: "housing",        label: "Housing",         icon: "⌂" },
  { value: "food",           label: "Food & Groceries", icon: "◉" },
  { value: "transport",      label: "Transport",        icon: "⬡" },
  { value: "health",         label: "Health",           icon: "♡" },
  { value: "subscriptions",  label: "Subscriptions",    icon: "↻" },
  { value: "entertainment",  label: "Entertainment",    icon: "◈" },
  { value: "insurance",      label: "Insurance",        icon: "◇" },
  { value: "personal",       label: "Personal",         icon: "◎" },
  { value: "education",      label: "Education",        icon: "△" },
  { value: "debt",           label: "Debt & Loans",     icon: "▽" },
  { value: "other",          label: "Other",            icon: "·" },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "budget_forecaster_v2";

const DEFAULTS = [
  { id: uid(), name: "Primary Job",    type: "income",  cadence: "biweekly", amount: 3500 },
  { id: uid(), name: "Rent",           type: "expense", cadence: "monthly",  amount: 1200, category: "housing" },
  { id: uid(), name: "Utilities",      type: "expense", cadence: "monthly",  amount: 150,  category: "housing" },
  { id: uid(), name: "Groceries",      type: "expense", cadence: "monthly",  amount: 400,  category: "food"    },
  { id: uid(), name: "Emergency Fund", type: "fund",    cadence: "monthly",  amount: 200  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMonthly(amount, cadence) {
  const c = CADENCES.find(c => c.value === cadence);
  return amount * (c ? c.multiplier : 1);
}

function weeksInMonth() {
  return 365.25 / 7 / 12; // ~4.348 — average weeks per month across the year
}

function fmt(n) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−$" : "$") + abs;
}

function load() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

const STEPS = ["type", "cadence", "details"];

function AddModal({ onClose, onSave, editItem }) {
  const isEdit = !!editItem;
  const [step, setStep]         = useState(isEdit ? "details" : "type");
  const [type, setType]         = useState(editItem?.type     || "");
  const [cadence, setCadence]   = useState(editItem?.cadence  || "");
  const [category, setCategory] = useState(editItem?.category || "");
  const [name, setName]         = useState(editItem?.name     || "");
  const [amount, setAmount]     = useState(editItem?.amount   || "");
  const nameRef = useRef(null);

  useEffect(() => {
    if (step === "details") setTimeout(() => nameRef.current?.focus(), 80);
  }, [step]);

  const typeObj    = TYPES.find(t => t.value === type);
  const cadenceObj = CADENCES.find(c => c.value === cadence);
  const catObj     = EXPENSE_CATEGORIES.find(c => c.value === category);

  function selectType(v)    { setType(v);    setStep("cadence"); }
  function selectCadence(v) { setCadence(v); setStep("details"); }

  function handleSave() {
    if (!name.trim() || !amount || isNaN(parseFloat(amount))) return;
    onSave({
      id: editItem?.id || uid(), type, cadence, name: name.trim(),
      amount: parseFloat(amount),
      ...(type === "expense" ? { category } : {}),
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {/* Modal header */}
        <div className="modal-hd">
          <div className="modal-title-row">
            {!isEdit && step !== "type" && (
              <button className="modal-nav-btn" onClick={() => setStep(STEPS[STEPS.indexOf(step) - 1])}>←</button>
            )}
            <h2 className="modal-title">
              {isEdit ? "Edit Item" : step === "type" ? "What type?" : step === "cadence" ? "How often?" : "Details"}
            </h2>
            <button className="modal-nav-btn" style={{ marginLeft: "auto" }} onClick={onClose}>✕</button>
          </div>

          {!isEdit && (
            <div className="modal-progress">
              {STEPS.map((s, i) => (
                <div key={s} className={`mpd ${step === s ? "mpd-active" : STEPS.indexOf(step) > i ? "mpd-done" : ""}`} />
              ))}
            </div>
          )}

          {(type || cadence) && (
            <div className="modal-crumbs">
              {type    && <span className="crumb" style={{ color: typeObj?.color }}>{typeObj?.icon} {typeObj?.label}</span>}
              {cadence && <span className="crumb">{cadenceObj?.label}</span>}
              {category && type === "expense" && <span className="crumb">{catObj?.icon} {catObj?.label}</span>}
            </div>
          )}
        </div>

        {/* Step 1 — Type */}
        {step === "type" && (
          <div className="modal-body">
            {TYPES.map(t => (
              <button key={t.value} className="choice-btn" style={{ "--c": t.color }} onClick={() => selectType(t.value)}>
                <span className="choice-icon" style={{ background: t.color + "22", color: t.color }}>{t.icon}</span>
                <span className="choice-label">{t.label}</span>
                <span className="choice-arr">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Cadence */}
        {step === "cadence" && (
          <div className="modal-body">
            {CADENCES.map(c => (
              <button key={c.value} className="choice-btn" style={{ "--c": typeObj?.color || "#f0c060" }} onClick={() => selectCadence(c.value)}>
                <span className="choice-label">{c.label}</span>
                <span className="choice-sub">{c.sub}</span>
                <span className="choice-arr">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3 — Details */}
        {step === "details" && (
          <div className="modal-body modal-body-form">
            <div className="field-grp">
              <label className="field-lbl">Label</label>
              <input
                ref={nameRef}
                className="field-inp"
                style={{ "--fc": typeObj?.color || "#f0c060" }}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder={
                  type === "income" ? "e.g. Salary, Freelance…" :
                  type === "fund"   ? "e.g. Emergency Fund…" :
                                     "e.g. Rent, Netflix…"
                }
              />
            </div>

            <div className="field-grp">
              <label className="field-lbl">Amount per {cadenceObj?.label.toLowerCase() || "period"}</label>
              <div className="field-amt-wrap" style={{ "--fc": typeObj?.color || "#f0c060" }}>
                <span className="field-dollar">$</span>
                <input
                  className="field-inp field-amt"
                  type="number" min="0" step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category — expenses only */}
            {type === "expense" && (
              <div className="field-grp">
                <label className="field-lbl">Category</label>
                <div className="chip-row">
                  {EXPENSE_CATEGORIES.map(c => (
                    <button key={c.value}
                      className={`chip ${category === c.value ? "chip-on" : ""}`}
                      style={{ "--cc": "var(--expense)" }}
                      onClick={() => setCategory(c.value)}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Edit mode: allow changing type & cadence inline */}
            {isEdit && (
              <>
                <div className="field-grp">
                  <label className="field-lbl">Type</label>
                  <div className="chip-row">
                    {TYPES.map(t => (
                      <button key={t.value}
                        className={`chip ${type === t.value ? "chip-on" : ""}`}
                        style={{ "--cc": t.color }}
                        onClick={() => setType(t.value)}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field-grp">
                  <label className="field-lbl">Cadence</label>
                  <div className="chip-row">
                    {CADENCES.map(c => (
                      <button key={c.value}
                        className={`chip ${cadence === c.value ? "chip-on" : ""}`}
                        style={{ "--cc": typeObj?.color || "#f0c060" }}
                        onClick={() => setCadence(c.value)}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button
              className="save-btn"
              style={{ "--fc": typeObj?.color || "#f0c060" }}
              onClick={handleSave}
              disabled={!name.trim() || !amount}
            >
              {isEdit ? "Save changes" : "Add to forecast"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, onEdit, onRemove }) {
  const typeObj    = TYPES.find(t => t.value === item.type);
  const cadenceObj = CADENCES.find(c => c.value === item.cadence);
  const catObj     = EXPENSE_CATEGORIES.find(c => c.value === item.category);
  const monthly    = toMonthly(item.amount, item.cadence);
  const cadShort   = { weekly: "wk", biweekly: "2wk", semimonthly: "2×/mo", monthly: "mo", quarterly: "qtr", annual: "yr" }[item.cadence] || item.cadence;

  return (
    <div className="item-row" onClick={() => onEdit(item)}>
      <span className="item-dot" style={{ background: typeObj?.color }} />
      <div className="item-info">
        <span className="item-name">{item.name || <em style={{ color: "var(--muted)" }}>Unnamed</em>}</span>
        <span className="item-meta">
          {cadenceObj?.label} · {fmt(monthly)}/mo
          {catObj && <span className="item-cat-badge">{catObj.icon} {catObj.label}</span>}
        </span>
      </div>
      <div className="item-right">
        <span className="item-amt" style={{ color: typeObj?.color }}>{fmt(item.amount)}</span>
        <span className="item-cad">/{cadShort}</span>
      </div>
      <button className="item-del" onClick={e => { e.stopPropagation(); onRemove(item.id); }} title="Remove">✕</button>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function BudgetForecaster() {
  const now = new Date();
  const [items, setItems]           = useState(DEFAULTS);
  const [loaded, setLoaded]         = useState(false);
  const [month, setMonth]           = useState(now.getMonth());
  const [year, setYear]             = useState(now.getFullYear());
  const [modal, setModal]           = useState(null);   // null | "add" | item
  const [filter, setFilter]         = useState("all");
  const [allView, setAllView]       = useState("grouped"); // "grouped" | "name" | "amount"
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const d = load();
    if (d?.items) setItems(d.items);
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) save({ items }); }, [items, loaded]);

  function handleSave(item) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = item; return n; }
      return [...prev, item];
    });
  }

  function handleRemove(id) { setItems(prev => prev.filter(i => i.id !== id)); }

  // Calculations
  const totalIncome  = items.filter(i => i.type === "income").reduce((s, i)  => s + toMonthly(i.amount, i.cadence), 0);
  const totalExpense = items.filter(i => i.type === "expense").reduce((s, i) => s + toMonthly(i.amount, i.cadence), 0);
  const totalFund    = items.filter(i => i.type === "fund").reduce((s, i)    => s + toMonthly(i.amount, i.cadence), 0);
  const available    = totalIncome - totalExpense - totalFund;
  const weeks        = weeksInMonth();
  const weeklyPay    = available / weeks;
  const isNeg        = weeklyPay < 0;
  const commitRatio  = totalIncome > 0 ? Math.min(1, (totalExpense + totalFund) / totalIncome) : 0;

  const yearOptions = Array.from({ length: 5 }, (_, k) => now.getFullYear() - 1 + k);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #111113; --surf: #18181b; --surf2: #222226; --border: #2c2c32;
          --text: #eeecea; --muted: #666470;
          --income: #4ade80; --expense: #f87171; --fund: #60a5fa; --gold: #f0c060;
          --r: 14px; --rs: 8px;
        }
        body { background: var(--bg); color: var(--text); font-family: 'Sora', sans-serif; }

        /* Layout */
        .app { min-height: 100vh; max-width: 680px; margin: 0 auto; padding: 2rem 1.25rem 6rem; }

        /* Header */
        .app-title { font-family: 'Playfair Display', serif; font-size: clamp(1.65rem,5vw,2.2rem); letter-spacing: -.02em; line-height: 1.1; }
        .app-title em { color: var(--gold); font-style: italic; }
        .app-sub { font-size: .78rem; color: var(--muted); margin-top: .3rem; font-weight: 300; }
        .month-row { display: flex; align-items: center; gap: .4rem; margin-top: 1.25rem; flex-wrap: wrap; }
        .mpill { background: var(--surf2); border: 1px solid var(--border); color: var(--muted);
          font-family: 'Sora', sans-serif; font-size: .72rem; font-weight: 500;
          padding: .28rem .62rem; border-radius: 999px; cursor: pointer; transition: all .13s; }
        .mpill:hover { color: var(--text); border-color: #444; }
        .mpill.on { background: var(--gold); border-color: var(--gold); color: #111; font-weight: 600; }
        .yr-sel { background: var(--surf2); border: 1px solid var(--border); color: var(--text);
          font-family: 'Sora', sans-serif; font-size: .78rem; padding: .28rem .6rem;
          border-radius: var(--rs); cursor: pointer; appearance: none; }

        /* Result card */
        .result { background: var(--surf); border: 1px solid var(--border); border-radius: var(--r);
          padding: 1.5rem; margin: 1.5rem 0; position: relative; overflow: hidden; }
        .result::after { content:''; position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(ellipse at top left, rgba(240,192,96,.06) 0%, transparent 60%); }
        .r-stripe { position:absolute; top:0; left:0; right:0; height:2px;
          background: linear-gradient(90deg, var(--gold), transparent); }
        .r-stripe.neg { background: linear-gradient(90deg, var(--expense), transparent); }
        .r-lbl { font-size: .67rem; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); font-weight: 500; }
        .r-big { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem,9vw,3.4rem);
          letter-spacing: -.03em; color: var(--gold); line-height: 1; margin: .25rem 0 .1rem; }
        .r-big.neg { color: var(--expense); }
        .r-hint { font-size: .77rem; color: var(--muted); }
        .r-hint b { color: var(--text); font-weight: 500; }
        .pbar { height: 3px; background: var(--surf2); border-radius: 2px; margin: 1.1rem 0 .3rem; overflow: hidden; }
        .pbar-fill { height:100%; border-radius:2px; transition: width .5s ease;
          background: linear-gradient(90deg, var(--expense), var(--fund)); }
        .pbar-lbl { font-size: .67rem; color: var(--muted); display:flex; justify-content:space-between; }
        .stat-row { display:grid; grid-template-columns: repeat(3,1fr); gap:.75rem; margin-top:1.25rem; padding-top:1.25rem; border-top: 1px solid var(--border); }
        .stat-lbl { font-size: .63rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:500; }
        .stat-val { font-family: 'Playfair Display', serif; font-size: 1.2rem; margin-top: .15rem; }
        .bk-toggle { background:none; border:none; color:var(--muted); font-family:'Sora',sans-serif;
          font-size:.73rem; cursor:pointer; display:flex; align-items:center; gap:.35rem;
          margin-top:1rem; padding:0; transition:color .13s; }
        .bk-toggle:hover { color:var(--text); }
        .bk-body { margin-top:.9rem; padding-top:.9rem; border-top:1px solid var(--border); display:grid; gap:.35rem; }
        .bk-row { display:flex; justify-content:space-between; font-size:.77rem; }
        .bk-l { color:var(--muted); }
        .bk-sep { border-top:1px solid var(--border); padding-top:.35rem; margin-top:.1rem; }

        /* Items list */
        .list-hd { display:flex; align-items:center; gap:.75rem; margin-bottom:.65rem; flex-wrap:wrap; }
        .list-title { font-size:.68rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:500; flex:1; }
        .fchips { display:flex; gap:.35rem; }
        .fchip { background:var(--surf2); border:1px solid var(--border); color:var(--muted);
          font-family:'Sora',sans-serif; font-size:.68rem; font-weight:500;
          padding:.24rem .6rem; border-radius:999px; cursor:pointer; transition:all .13s; }
        .fchip:hover { color:var(--text); }
        .fchip.on-all     { border-color:var(--gold);    color:var(--gold);    }
        .fchip.on-income  { border-color:var(--income);  color:var(--income);  }
        .fchip.on-expense { border-color:var(--expense); color:var(--expense); }
        .fchip.on-fund    { border-color:var(--fund);    color:var(--fund);    }

        .sort-row { display:flex; align-items:center; gap:.4rem; margin-bottom:.75rem; flex-wrap:wrap; }
        .sort-label { font-size:.65rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:500; margin-right:.15rem; }
        .sort-chip { background:var(--surf2); border:1px solid var(--border); color:var(--muted);
          font-family:'Sora',sans-serif; font-size:.68rem; font-weight:500;
          padding:.24rem .6rem; border-radius:999px; cursor:pointer; transition:all .13s; }
        .sort-chip:hover { color:var(--text); }
        .sort-chip.sort-on { border-color:var(--gold); color:var(--gold);
          background:color-mix(in srgb,var(--gold) 8%, var(--surf2)); }

        .items-list { display:grid; gap:.4rem; }
        .empty-state { text-align:center; padding:2.5rem 1rem; color:var(--muted); font-size:.85rem; }
        .empty-state span { display:block; font-size:1.75rem; margin-bottom:.5rem; opacity:.35; }

        /* Item row */
        .item-row { display:grid; grid-template-columns: 10px 1fr auto auto; align-items:center; gap:.75rem;
          background:var(--surf); border:1px solid var(--border); border-radius:var(--rs);
          padding:.7rem .85rem; cursor:pointer; transition:border-color .13s, background .13s; }
        .item-row:hover { border-color:#3c3c44; background:#1c1c20; }
        .item-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .item-info { min-width:0; }
        .item-name { font-size:.88rem; font-weight:500; color:var(--text); display:block;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .item-meta { font-size:.68rem; color:var(--muted); display:block; margin-top:.1rem; }
        .item-right { text-align:right; flex-shrink:0; }
        .item-amt { font-family:'Playfair Display',serif; font-size:1.05rem; display:block; }
        .item-cad { font-size:.63rem; color:var(--muted); }
        .item-del { background:none; border:1px solid transparent; color:var(--muted);
          width:26px; height:26px; border-radius:6px; cursor:pointer; font-size:.65rem;
          display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .13s; }
        .item-del:hover { border-color:var(--expense); color:var(--expense); }

        .item-cat-badge { display:inline-flex; align-items:center; gap:.2rem; margin-left:.5rem;
          background:rgba(248,113,113,.1); color:var(--expense); font-size:.63rem;
          padding:.1rem .4rem; border-radius:4px; font-weight:500; }

        /* Category groups */
        .cat-group { display:grid; gap:.4rem; }
        .cat-group + .cat-group { margin-top:.85rem; }
        .cat-group-hd { display:flex; align-items:center; gap:.5rem; padding:.15rem 0 .4rem;
          border-bottom:1px solid var(--border); margin-bottom:.1rem; }
        .cat-group-icon { font-size:.9rem; color:var(--expense); opacity:.7; width:18px; text-align:center; }
        .cat-group-label { font-size:.72rem; text-transform:uppercase; letter-spacing:.09em;
          color:var(--muted); font-weight:600; flex:1; }
        .cat-group-total { font-family:'Playfair Display',serif; font-size:.95rem; color:var(--expense); }

        /* FAB */
        .fab { position:fixed; bottom:1.75rem; right:1.75rem; z-index:50;
          background:var(--gold); color:#111; border:none; border-radius:999px;
          font-family:'Sora',sans-serif; font-size:.88rem; font-weight:600;
          padding:.8rem 1.5rem; cursor:pointer; display:flex; align-items:center; gap:.45rem;
          box-shadow: 0 4px 24px rgba(240,192,96,.35); transition:transform .15s, box-shadow .15s; }
        .fab:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(240,192,96,.45); }
        .fab:active { transform:scale(.97); }

        /* Modal */
        .modal-backdrop { position:fixed; inset:0; z-index:100; background:rgba(0,0,0,.72);
          backdrop-filter:blur(5px); display:flex; align-items:flex-end; justify-content:center;
          animation:bfadein .15s ease; }
        @keyframes bfadein { from { opacity:0; } }
        .modal { background:var(--surf); border:1px solid var(--border); border-radius:var(--r) var(--r) 0 0;
          width:100%; max-width:640px; max-height:92vh; overflow-y:auto;
          animation:slideup .22s cubic-bezier(.22,1,.36,1); }
        @keyframes slideup { from { transform:translateY(100%); } }
        .modal-hd { padding:1.25rem 1.25rem 0; position:sticky; top:0; background:var(--surf); z-index:1; }
        .modal-title-row { display:flex; align-items:center; gap:.75rem; }
        .modal-title { font-family:'Playfair Display',serif; font-size:1.25rem; flex:1; }
        .modal-nav-btn { background:none; border:1px solid var(--border); color:var(--muted);
          width:30px; height:30px; border-radius:8px; cursor:pointer; font-size:.88rem;
          display:flex; align-items:center; justify-content:center; transition:all .13s; flex-shrink:0; }
        .modal-nav-btn:hover { color:var(--text); border-color:#444; }
        .modal-progress { display:flex; gap:.4rem; margin-top:1rem; }
        .mpd { width:22px; height:3px; border-radius:2px; background:var(--border); transition:all .2s; }
        .mpd-active { background:var(--gold); width:34px; }
        .mpd-done { background:var(--gold); opacity:.4; }
        .modal-crumbs { display:flex; gap:.5rem; margin-top:.65rem; padding-bottom:.75rem;
          border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .crumb { font-size:.7rem; font-weight:500; color:var(--muted); background:var(--surf2);
          padding:.18rem .58rem; border-radius:999px; border:1px solid var(--border); }

        .modal-body { padding:1.1rem 1.25rem 2.5rem; display:grid; gap:.55rem; }
        .modal-body-form { gap:1.1rem; }

        /* Choice buttons */
        .choice-btn { display:flex; align-items:center; gap:.9rem; background:var(--surf2);
          border:1px solid var(--border); border-radius:var(--rs); padding:1rem 1.1rem;
          cursor:pointer; transition:all .13s; text-align:left; color:var(--text);
          font-family:'Sora',sans-serif; }
        .choice-btn:hover { border-color:var(--c, var(--gold)); background:color-mix(in srgb, var(--c,var(--gold)) 6%, var(--surf2)); }
        .choice-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center;
          justify-content:center; font-size:1rem; font-weight:700; flex-shrink:0; }
        .choice-label { font-size:.9rem; font-weight:500; flex:1; }
        .choice-sub { font-size:.73rem; color:var(--muted); }
        .choice-arr { color:var(--muted); font-size:.85rem; }

        /* Form fields */
        .field-grp { display:grid; gap:.42rem; }
        .field-lbl { font-size:.67rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:500; }
        .field-inp { background:var(--surf2); border:1px solid var(--border); color:var(--text);
          font-family:'Sora',sans-serif; font-size:.92rem; border-radius:var(--rs);
          padding:.7rem .85rem; outline:none; width:100%; transition:border-color .13s; }
        .field-inp:focus { border-color:var(--fc,var(--gold)); }
        .field-amt-wrap { display:flex; align-items:center; background:var(--surf2); border:1px solid var(--border);
          border-radius:var(--rs); padding:0 .85rem; transition:border-color .13s; }
        .field-amt-wrap:focus-within { border-color:var(--fc,var(--gold)); }
        .field-dollar { color:var(--muted); font-size:1rem; margin-right:3px; user-select:none; }
        .field-amt { border:none; background:transparent; padding:.7rem 0; flex:1; color:var(--text);
          font-family:'Sora',sans-serif; font-size:.92rem; outline:none;
          -moz-appearance:textfield; }
        .field-amt::-webkit-outer-spin-button, .field-amt::-webkit-inner-spin-button { -webkit-appearance:none; }
        .chip-row { display:flex; gap:.4rem; flex-wrap:wrap; }
        .chip { background:var(--surf2); border:1px solid var(--border); color:var(--muted);
          font-family:'Sora',sans-serif; font-size:.72rem; font-weight:500;
          padding:.28rem .65rem; border-radius:999px; cursor:pointer; transition:all .13s; }
        .chip:hover { color:var(--text); }
        .chip.chip-on { border-color:var(--cc,var(--gold)); color:var(--cc,var(--gold));
          background:color-mix(in srgb,var(--cc,var(--gold)) 10%, var(--surf2)); }
        .save-btn { background:var(--fc,var(--gold)); color:#111; border:none; border-radius:var(--rs);
          font-family:'Sora',sans-serif; font-size:.9rem; font-weight:600; padding:.85rem;
          cursor:pointer; margin-top:.4rem; transition:opacity .13s; }
        .save-btn:disabled { opacity:.4; cursor:not-allowed; }
        .save-btn:not(:disabled):hover { opacity:.88; }

        @media (max-width:480px) {
          .stat-row { grid-template-columns:1fr 1fr; }
          .r-big { font-size:2.2rem; }
          .fab { bottom:1rem; right:1rem; padding:.72rem 1.25rem; }
        }
      `}</style>

      <div className="app">
        {/* Header */}
        <header>
          <h1 className="app-title">Budget <em>Forecast</em></h1>
          <p className="app-sub">Plan your monthly cash flow &amp; weekly spending power</p>
          <div className="month-row">
            {MONTHS.map((m, i) => (
              <button key={m} className={`mpill ${month === i ? "on" : ""}`} onClick={() => setMonth(i)}>
                {m.slice(0, 3)}
              </button>
            ))}
            <select className="yr-sel" value={year} onChange={e => setYear(Number(e.target.value))}>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </header>

        {/* Result */}
        <div className="result">
          <div className={`r-stripe ${isNeg ? "neg" : ""}`} />
          <p className="r-lbl">Weekly pay — {MONTHS[month]} {year}</p>
          <p className={`r-big ${isNeg ? "neg" : ""}`}>
            {isNeg ? "−" : ""}${Math.abs(weeklyPay).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="r-hint">
            {fmt(available)} available ÷ <b>{weeks.toFixed(2)} weeks</b> in {MONTHS[month]}
          </p>

          {totalIncome > 0 && (
            <>
              <div className="pbar"><div className="pbar-fill" style={{ width: `${commitRatio * 100}%` }} /></div>
              <div className="pbar-lbl">
                <span>{(commitRatio * 100).toFixed(1)}% committed</span>
                <span>{fmt(available)}/mo free</span>
              </div>
            </>
          )}

          <div className="stat-row">
            <div><p className="stat-lbl">Income</p><p className="stat-val" style={{ color:"var(--income)" }}>{fmt(totalIncome)}</p></div>
            <div><p className="stat-lbl">Expenses</p><p className="stat-val" style={{ color:"var(--expense)" }}>{fmt(totalExpense)}</p></div>
            <div><p className="stat-lbl">Savings</p><p className="stat-val" style={{ color:"var(--fund)" }}>{fmt(totalFund)}</p></div>
          </div>

          <button className="bk-toggle" onClick={() => setShowBreakdown(b => !b)}>
            {showBreakdown ? "▲ Hide" : "▼ Show"} calculation breakdown
          </button>
          {showBreakdown && (
            <div className="bk-body">
              {[
                ["Monthly income",   fmt(totalIncome),   "var(--income)"],
                ["Monthly expenses", "−"+fmt(totalExpense), "var(--expense)"],
                ["Funds & savings",  "−"+fmt(totalFund),   "var(--fund)"],
              ].map(([l, v, c]) => (
                <div className="bk-row" key={l}>
                  <span className="bk-l">{l}</span>
                  <span style={{ color:c, fontWeight:500 }}>{v}</span>
                </div>
              ))}
              <div className="bk-row bk-sep">
                <span className="bk-l">Available</span>
                <span style={{ fontWeight:500 }}>{fmt(available)}</span>
              </div>
              <div className="bk-row">
                <span className="bk-l">Weeks in {MONTHS[month]}</span>
                <span style={{ fontWeight:500 }}>÷ {weeks.toFixed(4)}</span>
              </div>
              <div className="bk-row bk-sep">
                <span className="bk-l"><b>Weekly pay</b></span>
                <span style={{ color: isNeg ? "var(--expense)" : "var(--income)", fontWeight:600 }}>{fmt(weeklyPay)}</span>
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="list-hd">
          <span className="list-title">{items.length} item{items.length !== 1 ? "s" : ""}</span>
          <div className="fchips">
            {[["all","All"],["income","Income"],["expense","Expenses"],["fund","Savings"]].map(([v, l]) => (
              <button key={v} className={`fchip ${filter === v ? `on-${v}` : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Sort controls — only on All tab */}
        {filter === "all" && (
          <div className="sort-row">
            <span className="sort-label">View</span>
            {[["grouped","⊞ Grouped"],["name","A–Z"],["amount","$ Amount"]].map(([v, l]) => (
              <button key={v} className={`sort-chip ${allView === v ? "sort-on" : ""}`} onClick={() => setAllView(v)}>{l}</button>
            ))}
          </div>
        )}

        <div className="items-list">
          {filter === "all" ? (() => {
            if (items.length === 0) return (
              <div className="empty-state"><span>◎</span>No items yet — tap <b>+ Add Item</b></div>
            );

            if (allView === "grouped") {
              const TYPE_ORDER = [
                { type: "income",  label: "Income",       color: "var(--income)" },
                { type: "expense", label: "Expenses",     color: "var(--expense)" },
                { type: "fund",    label: "Funds & Savings", color: "var(--fund)" },
              ];
              return TYPE_ORDER.map(({ type, label, color }) => {
                const rows = items.filter(i => i.type === type);
                if (rows.length === 0) return null;
                const subtotal = rows.reduce((s, i) => s + toMonthly(i.amount, i.cadence), 0);
                return (
                  <div key={type} className="cat-group">
                    <div className="cat-group-hd">
                      <span className="cat-group-label" style={{ color }}>{label}</span>
                      <span className="cat-group-total" style={{ color }}>{fmt(subtotal)}/mo</span>
                    </div>
                    {rows.map(item => (
                      <ItemRow key={item.id} item={item} onEdit={i => setModal(i)} onRemove={handleRemove} />
                    ))}
                  </div>
                );
              });
            }

            const sorted = [...items].sort((a, b) =>
              allView === "name"
                ? a.name.localeCompare(b.name)
                : toMonthly(b.amount, b.cadence) - toMonthly(a.amount, a.cadence)
            );
            return sorted.map(item => (
              <ItemRow key={item.id} item={item} onEdit={i => setModal(i)} onRemove={handleRemove} />
            ));
          })() : filter === "expense" ? (() => {
            const expenses = items.filter(i => i.type === "expense");
            if (expenses.length === 0) return (
              <div className="empty-state"><span>◎</span>No expenses yet — tap <b>+ Add Item</b></div>
            );
            const groups = EXPENSE_CATEGORIES.map(cat => ({
              cat,
              rows: expenses.filter(i => (i.category || "other") === cat.value),
            })).filter(g => g.rows.length > 0);
            return groups.map(({ cat, rows }) => {
              const subtotal = rows.reduce((s, i) => s + toMonthly(i.amount, i.cadence), 0);
              return (
                <div key={cat.value} className="cat-group">
                  <div className="cat-group-hd">
                    <span className="cat-group-icon">{cat.icon}</span>
                    <span className="cat-group-label">{cat.label}</span>
                    <span className="cat-group-total">{fmt(subtotal)}/mo</span>
                  </div>
                  {rows.map(item => (
                    <ItemRow key={item.id} item={item} onEdit={i => setModal(i)} onRemove={handleRemove} />
                  ))}
                </div>
              );
            });
          })() : (() => {
            const filtered2 = items.filter(i => i.type === filter);
            return filtered2.length === 0 ? (
              <div className="empty-state">
                <span>◎</span>No {filter} items — tap <b>+ Add Item</b> to get started
              </div>
            ) : filtered2.map(item => (
              <ItemRow key={item.id} item={item} onEdit={i => setModal(i)} onRemove={handleRemove} />
            ));
          })()}
        </div>
      </div>

      {/* Floating Add Button */}
      <button className="fab" onClick={() => setModal("add")}>+ Add Item</button>

      {/* Modal */}
      {modal && (
        <AddModal
          onClose={() => setModal(null)}
          onSave={handleSave}
          editItem={modal === "add" ? null : modal}
        />
      )}
    </>
  );
}
