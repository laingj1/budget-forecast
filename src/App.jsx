import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const TYPES = [
  { value: "income",  label: "Income",         icon: "↑", color: "#4ade80" },
  { value: "expense", label: "Expense",         icon: "↓", color: "#f87171" },
  { value: "fund",    label: "Fund / Savings",  icon: "◆", color: "#60a5fa" },
];

const CADENCES = [
  { value: "weekly",      label: "Weekly",        sub: "every week",      multiplier: 4.333 },
  { value: "biweekly",    label: "Bi-weekly",     sub: "every 2 weeks",   multiplier: 2.167 },
  { value: "semimonthly", label: "Twice a month", sub: "1st & 15th",      multiplier: 2     },
  { value: "monthly",     label: "Monthly",       sub: "once a month",    multiplier: 1     },
  { value: "quarterly",   label: "Quarterly",     sub: "every 3 months",  multiplier: 1/3   },
  { value: "annual",      label: "Annual",        sub: "once a year",     multiplier: 1/12  },
];

const EXPENSE_CATEGORIES = [
  { value: "housing",       label: "Housing",          icon: "⌂" },
  { value: "food",          label: "Food & Groceries",  icon: "◉" },
  { value: "transport",     label: "Transport",         icon: "⬡" },
  { value: "health",        label: "Health",            icon: "♡" },
  { value: "subscriptions", label: "Subscriptions",     icon: "↻" },
  { value: "entertainment", label: "Entertainment",     icon: "◈" },
  { value: "insurance",     label: "Insurance",         icon: "◇" },
  { value: "personal",      label: "Personal",          icon: "◎" },
  { value: "education",     label: "Education",         icon: "△" },
  { value: "debt",          label: "Debt & Loans",      icon: "▽" },
  { value: "other",         label: "Other",             icon: "·" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMonthly(amount, cadence) {
  const c = CADENCES.find(c => c.value === cadence);
  return amount * (c ? c.multiplier : 1);
}

function weeksInMonth() {
  return 365.25 / 7 / 12;
}

function fmt(n) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−$" : "$") + abs;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [mode, setMode]         = useState("login"); // "login" | "reset"
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setResetSent(true);
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #111113; --surf: #18181b; --surf2: #222226; --border: #2c2c32;
          --text: #eeecea; --muted: #666470; --gold: #f0c060; --expense: #f87171;
          --r: 14px; --rs: 8px;
        }
        body { background: var(--bg); color: var(--text); font-family: 'Sora', sans-serif; }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: var(--bg);
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(240,192,96,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(96,165,250,0.03) 0%, transparent 50%);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: var(--surf);
          border: 1px solid var(--border);
          border-radius: var(--r);
          overflow: hidden;
          position: relative;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), rgba(240,192,96,0.2), transparent);
        }

        .login-top {
          padding: 2.25rem 2rem 1.75rem;
          border-bottom: 1px solid var(--border);
        }

        .login-eyebrow {
          font-size: .65rem;
          text-transform: uppercase;
          letter-spacing: .15em;
          color: var(--gold);
          font-weight: 600;
          margin-bottom: .6rem;
          opacity: .8;
        }

        .login-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          letter-spacing: -.02em;
          line-height: 1.1;
          color: var(--text);
        }

        .login-title em { color: var(--gold); font-style: italic; }

        .login-sub {
          font-size: .78rem;
          color: var(--muted);
          margin-top: .4rem;
          font-weight: 300;
        }

        .login-body { padding: 1.75rem 2rem 2rem; }

        .login-form { display: grid; gap: .9rem; }

        .login-field { display: grid; gap: .4rem; }

        .login-label {
          font-size: .67rem;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: var(--muted);
          font-weight: 500;
        }

        .login-input {
          background: var(--surf2);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'Sora', sans-serif;
          font-size: .92rem;
          border-radius: var(--rs);
          padding: .75rem .9rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          width: 100%;
        }

        .login-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(240,192,96,.08);
        }

        .login-input::placeholder { color: var(--muted); opacity: .6; }

        .login-btn {
          background: var(--gold);
          color: #111;
          border: none;
          border-radius: var(--rs);
          font-family: 'Sora', sans-serif;
          font-size: .9rem;
          font-weight: 600;
          padding: .85rem;
          cursor: pointer;
          margin-top: .35rem;
          transition: opacity .13s, transform .13s;
          letter-spacing: .01em;
        }

        .login-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .login-btn:active:not(:disabled) { transform: scale(.98); }
        .login-btn:disabled { opacity: .45; cursor: not-allowed; }

        .login-divider {
          display: flex;
          align-items: center;
          gap: .75rem;
          margin: .25rem 0;
        }

        .login-divider::before, .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .login-divider span {
          font-size: .65rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .login-link {
          background: none;
          border: 1px solid var(--border);
          color: var(--muted);
          font-family: 'Sora', sans-serif;
          font-size: .8rem;
          cursor: pointer;
          padding: .65rem;
          border-radius: var(--rs);
          transition: all .13s;
          width: 100%;
          text-align: center;
        }

        .login-link:hover { color: var(--text); border-color: #444; }

        .login-error {
          font-size: .78rem;
          color: var(--expense);
          background: rgba(248,113,113,.08);
          padding: .65rem .8rem;
          border-radius: var(--rs);
          border: 1px solid rgba(248,113,113,.2);
        }

        .login-success {
          text-align: center;
          display: grid;
          gap: 1rem;
          padding: .5rem 0;
        }

        .login-success-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: .25rem;
        }

        .login-success p {
          font-size: .85rem;
          color: var(--muted);
          line-height: 1.5;
        }

        .login-success strong { color: var(--text); }

        .login-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
        }

        .login-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(17,17,17,.3);
          border-top-color: #111;
          border-radius: 50%;
          animation: lspin .6s linear infinite;
        }

        @keyframes lspin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-top">
            <p className="login-eyebrow">Private Access</p>
            <h1 className="login-title">Budget <em>Forecast</em></h1>
            <p className="login-sub">
              {mode === "login" ? "Sign in to your account to continue" : "We'll send you a reset link"}
            </p>
          </div>

          <div className="login-body">
            {mode === "login" && (
              <form className="login-form" onSubmit={handleLogin}>
                <div className="login-field">
                  <label className="login-label">Email</label>
                  <input
                    className="login-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    autoFocus
                  />
                </div>
                <div className="login-field">
                  <label className="login-label">Password</label>
                  <input
                    className="login-input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <p className="login-error">{error}</p>}
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading
                    ? <span className="login-loading"><span className="login-spinner" /> Signing in…</span>
                    : "Sign in"}
                </button>
                <div className="login-divider"><span>or</span></div>
                <button type="button" className="login-link" onClick={() => { setMode("reset"); setError(""); }}>
                  Forgot password?
                </button>
              </form>
            )}

            {mode === "reset" && !resetSent && (
              <form className="login-form" onSubmit={handleReset}>
                <div className="login-field">
                  <label className="login-label">Email</label>
                  <input
                    className="login-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="login-error">{error}</p>}
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading
                    ? <span className="login-loading"><span className="login-spinner" /> Sending…</span>
                    : "Send reset link"}
                </button>
                <div className="login-divider"><span>or</span></div>
                <button type="button" className="login-link" onClick={() => { setMode("login"); setError(""); }}>
                  Back to sign in
                </button>
              </form>
            )}

            {mode === "reset" && resetSent && (
              <div className="login-success">
                <span className="login-success-icon">✉️</span>
                <p>Check your inbox — we sent a reset link to <strong>{email}</strong></p>
                <button type="button" className="login-link" onClick={() => { setMode("login"); setResetSent(false); }}>
                  Back to sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

const STEPS = ["type", "cadence", "details"];

function AddModal({ onClose, onSave, editItem, saving }) {
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
      ...(editItem?.id ? { id: editItem.id } : {}),
      type, cadence, name: name.trim(),
      amount: parseFloat(amount),
      ...(type === "expense" ? { category } : { category: null }),
    });
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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
              disabled={!name.trim() || !amount || saving}
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add to forecast"}
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

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function BudgetForecaster() {
  const now = new Date();

  // ── Auth state ──
  const [session, setSession]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── App state ──
  const [items, setItems]           = useState([]);
  const [dbLoading, setDbLoading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [month, setMonth]           = useState(now.getMonth());
  const [year, setYear]             = useState(now.getFullYear());
  const [modal, setModal]           = useState(null);
  const [filter, setFilter]         = useState("all");
  const [allView, setAllView]       = useState("grouped");
  const [showBreakdown, setShowBreakdown] = useState(false);

  // ── Listen for auth changes ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load items from Supabase when session changes ──
  useEffect(() => {
    if (!session) { setItems([]); return; }
    loadItems();
  }, [session]);

  async function loadItems() {
    setDbLoading(true);
    const { data, error } = await supabase
      .from("budget_items")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (error) console.error("Error loading items:", error.message);
    else setItems(data || []);
    setDbLoading(false);
  }

  // ── Save (add or update) ──
  async function handleSave(item) {
    setSaving(true);
    const userId = session.user.id;

    if (item.id) {
      // Update existing row
      const { error } = await supabase
        .from("budget_items")
        .update({
          name: item.name,
          type: item.type,
          cadence: item.cadence,
          amount: item.amount,
          category: item.category || null,
        })
        .eq("id", item.id)
        .eq("user_id", userId);

      if (error) { console.error("Update error:", error.message); setSaving(false); return; }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...item } : i));
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from("budget_items")
        .insert({
          user_id: userId,
          name: item.name,
          type: item.type,
          cadence: item.cadence,
          amount: item.amount,
          category: item.category || null,
        })
        .select()
        .single();

      if (error) { console.error("Insert error:", error.message); setSaving(false); return; }
      setItems(prev => [...prev, data]);
    }

    setSaving(false);
    setModal(null);
  }

  // ── Remove ──
  async function handleRemove(id) {
    const { error } = await supabase
      .from("budget_items")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) { console.error("Delete error:", error.message); return; }
    setItems(prev => prev.filter(i => i.id !== id));
  }

  // ── Logout ──
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ── Calculations ──
  const totalIncome  = items.filter(i => i.type === "income").reduce((s, i)  => s + toMonthly(i.amount, i.cadence), 0);
  const totalExpense = items.filter(i => i.type === "expense").reduce((s, i) => s + toMonthly(i.amount, i.cadence), 0);
  const totalFund    = items.filter(i => i.type === "fund").reduce((s, i)    => s + toMonthly(i.amount, i.cadence), 0);
  const available    = totalIncome - totalExpense - totalFund;
  const weeks        = weeksInMonth();
  const weeklyPay    = available / weeks;
  const isNeg        = weeklyPay < 0;
  const commitRatio  = totalIncome > 0 ? Math.min(1, (totalExpense + totalFund) / totalIncome) : 0;

  const yearOptions  = Array.from({ length: 5 }, (_, k) => now.getFullYear() - 1 + k);

  // ── Loading states ──
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

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

        /* Loading */
        .loading-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); }
        .loading-spinner { width:32px; height:32px; border:2px solid var(--border);
          border-top-color:var(--gold); border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Login */
        .login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center;
          padding:1.5rem; background:var(--bg); }
        .login-card { width:100%; max-width:400px; background:var(--surf); border:1px solid var(--border);
          border-radius:var(--r); padding:2rem; }
        .login-title { font-family:'Playfair Display',serif; font-size:1.9rem; letter-spacing:-.02em; }
        .login-title em { color:var(--gold); font-style:italic; }
        .login-sub { font-size:.8rem; color:var(--muted); margin-top:.3rem; font-weight:300; }
        .login-form { display:grid; gap:1rem; margin-top:1.75rem; }
        .login-field { display:grid; gap:.4rem; }
        .login-label { font-size:.68rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:500; }
        .login-input { background:var(--surf2); border:1px solid var(--border); color:var(--text);
          font-family:'Sora',sans-serif; font-size:.92rem; border-radius:var(--rs);
          padding:.7rem .85rem; outline:none; transition:border-color .13s; }
        .login-input:focus { border-color:var(--gold); }
        .login-btn { background:var(--gold); color:#111; border:none; border-radius:var(--rs);
          font-family:'Sora',sans-serif; font-size:.9rem; font-weight:600; padding:.85rem;
          cursor:pointer; transition:opacity .13s; margin-top:.25rem; }
        .login-btn:hover:not(:disabled) { opacity:.88; }
        .login-btn:disabled { opacity:.5; cursor:not-allowed; }
        .login-error { font-size:.78rem; color:var(--expense); background:rgba(248,113,113,.1);
          padding:.6rem .75rem; border-radius:var(--rs); border:1px solid rgba(248,113,113,.2); }
        .login-link { background:none; border:none; color:var(--muted); font-family:'Sora',sans-serif;
          font-size:.78rem; cursor:pointer; padding:0; text-align:center; transition:color .13s; }
        .login-link:hover { color:var(--text); }
        .login-success { text-align:center; margin-top:1.5rem; display:grid; gap:1rem; }
        .login-success p { font-size:.85rem; color:var(--text); }

        /* Layout */
        .app { min-height:100vh; max-width:680px; margin:0 auto; padding:2rem 1.25rem 6rem; }

        /* Header */
        .app-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .app-title { font-family:'Playfair Display',serif; font-size:clamp(1.65rem,5vw,2.2rem); letter-spacing:-.02em; line-height:1.1; }
        .app-title em { color:var(--gold); font-style:italic; }
        .app-sub { font-size:.78rem; color:var(--muted); margin-top:.3rem; font-weight:300; }
        .logout-btn { background:none; border:1px solid var(--border); color:var(--muted);
          font-family:'Sora',sans-serif; font-size:.72rem; padding:.35rem .75rem;
          border-radius:999px; cursor:pointer; transition:all .13s; white-space:nowrap; flex-shrink:0; }
        .logout-btn:hover { border-color:#444; color:var(--text); }
        .month-row { display:flex; align-items:center; gap:.4rem; margin-top:1.25rem; flex-wrap:wrap; }
        .mpill { background:var(--surf2); border:1px solid var(--border); color:var(--muted);
          font-family:'Sora',sans-serif; font-size:.72rem; font-weight:500;
          padding:.28rem .62rem; border-radius:999px; cursor:pointer; transition:all .13s; }
        .mpill:hover { color:var(--text); border-color:#444; }
        .mpill.on { background:var(--gold); border-color:var(--gold); color:#111; font-weight:600; }
        .yr-sel { background:var(--surf2); border:1px solid var(--border); color:var(--text);
          font-family:'Sora',sans-serif; font-size:.78rem; padding:.28rem .6rem;
          border-radius:var(--rs); cursor:pointer; appearance:none; }

        /* DB loading bar */
        .db-bar { height:2px; background:var(--surf2); border-radius:2px; margin-bottom:1rem; overflow:hidden; }
        .db-bar-fill { height:100%; background:var(--gold); border-radius:2px;
          animation:dbload 1.2s ease-in-out infinite; }
        @keyframes dbload { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }

        /* Result card */
        .result { background:var(--surf); border:1px solid var(--border); border-radius:var(--r);
          padding:1.5rem; margin:1.5rem 0; position:relative; overflow:hidden; }
        .result::after { content:''; position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(ellipse at top left,rgba(240,192,96,.06) 0%,transparent 60%); }
        .r-stripe { position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,var(--gold),transparent); }
        .r-stripe.neg { background:linear-gradient(90deg,var(--expense),transparent); }
        .r-lbl { font-size:.67rem; text-transform:uppercase; letter-spacing:.12em; color:var(--muted); font-weight:500; }
        .r-big { font-family:'Playfair Display',serif; font-size:clamp(2.2rem,9vw,3.4rem);
          letter-spacing:-.03em; color:var(--gold); line-height:1; margin:.25rem 0 .1rem; }
        .r-big.neg { color:var(--expense); }
        .r-hint { font-size:.77rem; color:var(--muted); }
        .r-hint b { color:var(--text); font-weight:500; }
        .pbar { height:3px; background:var(--surf2); border-radius:2px; margin:1.1rem 0 .3rem; overflow:hidden; }
        .pbar-fill { height:100%; border-radius:2px; transition:width .5s ease;
          background:linear-gradient(90deg,var(--expense),var(--fund)); }
        .pbar-lbl { font-size:.67rem; color:var(--muted); display:flex; justify-content:space-between; }
        .stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; margin-top:1.25rem;
          padding-top:1.25rem; border-top:1px solid var(--border); }
        .stat-lbl { font-size:.63rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:500; }
        .stat-val { font-family:'Playfair Display',serif; font-size:1.2rem; margin-top:.15rem; }
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
          background:color-mix(in srgb,var(--gold) 8%,var(--surf2)); }
        .items-list { display:grid; gap:.4rem; }
        .empty-state { text-align:center; padding:2.5rem 1rem; color:var(--muted); font-size:.85rem; }
        .empty-state span { display:block; font-size:1.75rem; margin-bottom:.5rem; opacity:.35; }

        /* Item row */
        .item-row { display:grid; grid-template-columns:10px 1fr auto auto; align-items:center; gap:.75rem;
          background:var(--surf); border:1px solid var(--border); border-radius:var(--rs);
          padding:.7rem .85rem; cursor:pointer; transition:border-color .13s,background .13s; }
        .item-row:hover { border-color:#3c3c44; background:#1c1c20; }
        .item-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .item-info { min-width:0; }
        .item-name { font-size:.88rem; font-weight:500; color:var(--text); display:block;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .item-meta { font-size:.68rem; color:var(--muted); display:block; margin-top:.1rem; }
        .item-cat-badge { display:inline-flex; align-items:center; gap:.2rem; margin-left:.5rem;
          background:rgba(248,113,113,.1); color:var(--expense); font-size:.63rem;
          padding:.1rem .4rem; border-radius:4px; font-weight:500; }
        .item-right { text-align:right; flex-shrink:0; }
        .item-amt { font-family:'Playfair Display',serif; font-size:1.05rem; display:block; }
        .item-cad { font-size:.63rem; color:var(--muted); }
        .item-del { background:none; border:1px solid transparent; color:var(--muted);
          width:26px; height:26px; border-radius:6px; cursor:pointer; font-size:.65rem;
          display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .13s; }
        .item-del:hover { border-color:var(--expense); color:var(--expense); }

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
          box-shadow:0 4px 24px rgba(240,192,96,.35); transition:transform .15s,box-shadow .15s; }
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
        .choice-btn { display:flex; align-items:center; gap:.9rem; background:var(--surf2);
          border:1px solid var(--border); border-radius:var(--rs); padding:1rem 1.1rem;
          cursor:pointer; transition:all .13s; text-align:left; color:var(--text); font-family:'Sora',sans-serif; }
        .choice-btn:hover { border-color:var(--c,var(--gold)); background:color-mix(in srgb,var(--c,var(--gold)) 6%,var(--surf2)); }
        .choice-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center;
          justify-content:center; font-size:1rem; font-weight:700; flex-shrink:0; }
        .choice-label { font-size:.9rem; font-weight:500; flex:1; }
        .choice-sub { font-size:.73rem; color:var(--muted); }
        .choice-arr { color:var(--muted); font-size:.85rem; }
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
          font-family:'Sora',sans-serif; font-size:.92rem; outline:none; -moz-appearance:textfield; }
        .field-amt::-webkit-outer-spin-button,.field-amt::-webkit-inner-spin-button { -webkit-appearance:none; }
        .chip-row { display:flex; gap:.4rem; flex-wrap:wrap; }
        .chip { background:var(--surf2); border:1px solid var(--border); color:var(--muted);
          font-family:'Sora',sans-serif; font-size:.72rem; font-weight:500;
          padding:.28rem .65rem; border-radius:999px; cursor:pointer; transition:all .13s; }
        .chip:hover { color:var(--text); }
        .chip.chip-on { border-color:var(--cc,var(--gold)); color:var(--cc,var(--gold));
          background:color-mix(in srgb,var(--cc,var(--gold)) 10%,var(--surf2)); }
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
          <div className="app-hd">
            <div>
              <h1 className="app-title">Budget <em>Forecast</em></h1>
              <p className="app-sub">{session.user.email}</p>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
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

        {/* DB loading indicator */}
        {dbLoading && <div className="db-bar"><div className="db-bar-fill" /></div>}

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
                ["Monthly income",   fmt(totalIncome),        "var(--income)"],
                ["Monthly expenses", "−" + fmt(totalExpense), "var(--expense)"],
                ["Funds & savings",  "−" + fmt(totalFund),    "var(--fund)"],
              ].map(([l, v, c]) => (
                <div className="bk-row" key={l}>
                  <span className="bk-l">{l}</span>
                  <span style={{ color: c, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div className="bk-row bk-sep">
                <span className="bk-l">Available</span>
                <span style={{ fontWeight: 500 }}>{fmt(available)}</span>
              </div>
              <div className="bk-row">
                <span className="bk-l">Weeks in {MONTHS[month]}</span>
                <span style={{ fontWeight: 500 }}>÷ {weeks.toFixed(4)}</span>
              </div>
              <div className="bk-row bk-sep">
                <span className="bk-l"><b>Weekly pay</b></span>
                <span style={{ color: isNeg ? "var(--expense)" : "var(--income)", fontWeight: 600 }}>{fmt(weeklyPay)}</span>
              </div>
            </div>
          )}
        </div>

        {/* List header */}
        <div className="list-hd">
          <span className="list-title">{items.length} item{items.length !== 1 ? "s" : ""}</span>
          <div className="fchips">
            {[["all","All"],["income","Income"],["expense","Expenses"],["fund","Savings"]].map(([v, l]) => (
              <button key={v} className={`fchip ${filter === v ? `on-${v}` : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {filter === "all" && (
          <div className="sort-row">
            <span className="sort-label">View</span>
            {[["grouped","⊞ Grouped"],["name","A–Z"],["amount","$ Amount"]].map(([v, l]) => (
              <button key={v} className={`sort-chip ${allView === v ? "sort-on" : ""}`} onClick={() => setAllView(v)}>{l}</button>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="items-list">
          {filter === "all" ? (() => {
            if (items.length === 0) return (
              <div className="empty-state"><span>◎</span>No items yet — tap <b>+ Add Item</b></div>
            );
            if (allView === "grouped") {
              return [
                { type: "income",  label: "Income",          color: "var(--income)"  },
                { type: "expense", label: "Expenses",        color: "var(--expense)" },
                { type: "fund",    label: "Funds & Savings", color: "var(--fund)"    },
              ].map(({ type, label, color }) => {
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
            return EXPENSE_CATEGORIES.map(cat => {
              const rows = expenses.filter(i => (i.category || "other") === cat.value);
              if (rows.length === 0) return null;
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
            const filtered = items.filter(i => i.type === filter);
            return filtered.length === 0 ? (
              <div className="empty-state">
                <span>◎</span>No {filter} items — tap <b>+ Add Item</b>
              </div>
            ) : filtered.map(item => (
              <ItemRow key={item.id} item={item} onEdit={i => setModal(i)} onRemove={handleRemove} />
            ));
          })()}
        </div>
      </div>

      <button className="fab" onClick={() => setModal("add")}>+ Add Item</button>

      {modal && (
        <AddModal
          onClose={() => setModal(null)}
          onSave={handleSave}
          editItem={modal === "add" ? null : modal}
          saving={saving}
        />
      )}
    </>
  );
}
