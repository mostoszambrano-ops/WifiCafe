import type { CSSProperties } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import logoImg from "/logo.png";
import { useMenuImages } from "@/hooks/useMenuImages";
import {
  cachapas, burgers, hotdogs, burritos,
  morocho, especiales, ensaladas, papas, combos,
} from "@/data/menu";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const BASE = import.meta.env.VITE_API_URL ?? "/";

type Stats = {
  salesByDay: { day: string; total: number; count: number }[];
  topProducts: { name: string; qty: number }[];
  byHour: { hour: string; count: number }[];
  totalWeek: number;
  totalOrders: number;
};

type OrderItem = {
  id: number;
  itemName: string;
  itemPrice: string;
  itemPriceNum: number;
  quantity: number;
  section: string;
  notes: string;
};

type Order = {
  id: number;
  customerName: string;
  phone: string;
  tableNumber: string;
  status: string;
  total: number;
  notes: string;
  createdAt: string;
  items: OrderItem[];
};

const STAFF_PIN = "1904";
const SESSION_KEY = "wificafe_staff_auth";

const STATUS_META: Record<string, { label: string; color: string; bg: string; next: string | null; nextLabel: string | null }> = {
  pendiente:  { label: "Sin Pago",   color: "#F5A800", bg: "rgba(245,168,0,0.12)",  next: "pagado",     nextLabel: "💰 Cobrar" },
  pagado:     { label: "Pagado",     color: "#4ADE80", bg: "rgba(74,222,128,0.12)", next: "preparando", nextLabel: "▶ Preparar" },
  preparando: { label: "Preparando", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", next: "listo",      nextLabel: "✓ Listo" },
  listo:      { label: "Listo",      color: "#A78BFA", bg: "rgba(167,139,250,0.12)",next: null,         nextLabel: null },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 90_000;
}

function formatPrice(num: number): string {
  return num.toLocaleString("es-VE") + "$";
}

export function Staff() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const { getImage, uploadImage, removeImage } = useMenuImages();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoKeyRef = useRef<string>("");

  function handlePhotoThumb(key: string) {
    photoKeyRef.current = key;
    photoInputRef.current?.click();
  }
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && photoKeyRef.current) uploadImage(photoKeyRef.current, file);
    e.target.value = "";
  }

  // All unique image-able items grouped by section, matching key logic used in App.tsx
  const IMAGE_SECTIONS: { section: string; items: { key: string; label: string }[] }[] = [
    {
      section: "🌽 Cachapas",
      items: [...new Map(cachapas.map(i => [i.name, { key: i.name, label: i.name }])).values()],
    },
    {
      section: "🍔 Hamburguesas",
      items: burgers
        .map(i => ({ key: i.name + (i.desc ? `__${i.desc}` : ""), label: i.desc ? `${i.name} · ${i.desc}` : i.name }))
        .filter((v, idx, arr) => arr.findIndex(x => x.key === v.key) === idx),
    },
    {
      section: "🌭 Perros",
      items: hotdogs
        .map(i => ({ key: i.name + (i.desc ? `__${i.desc}` : ""), label: i.desc ? `${i.name} · ${i.desc}` : i.name }))
        .filter((v, idx, arr) => arr.findIndex(x => x.key === v.key) === idx),
    },
    {
      section: "🌯 Burritos",
      items: burritos
        .map(i => ({ key: i.name + (i.desc ? `__${i.desc}` : ""), label: i.desc ? `${i.name} · ${i.desc}` : i.name }))
        .filter((v, idx, arr) => arr.findIndex(x => x.key === v.key) === idx),
    },
    {
      section: "🥙 Morocho",
      items: morocho.map(i => ({ key: i.name, label: i.name })),
    },
    {
      section: "⭐ Especiales & Ensaladas",
      items: [...especiales, ...ensaladas].map(i => ({ key: i.name, label: i.name })),
    },
    {
      section: "🍟 Papas",
      items: papas.map(i => ({ key: i.name, label: i.name })),
    },
    {
      section: "🔥 Combos",
      items: combos.map(i => ({ key: i.name, label: i.name })),
    },
  ];

  function handlePinKey(digit: string) {
    if (pinError) setPinError(false);
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === STAFF_PIN.length) {
      if (next === STAFF_PIN) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setUnlocked(true);
      } else {
        setPinError(true);
        setTimeout(() => { setPinInput(""); setPinError(false); }, 700);
      }
    }
  }

  function handlePinDelete() {
    setPinInput(p => p.slice(0, -1));
    if (pinError) setPinError(false);
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("activo");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [newAlert, setNewAlert] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  function playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const play = () => {
        [[880, 0, 0.25], [1100, 0.18, 0.45]].forEach(([freq, start, end]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + end);
        });
      };
      if (ctx.state === "suspended") ctx.resume().then(play);
      else play();
    } catch { /* silencioso */ }
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}api/orders`);
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
        setLastFetch(new Date());

        const activeCount = data.filter(o => o.status !== "listo").length;
        if (prevCountRef.current !== null && activeCount > prevCountRef.current) {
          setNewAlert(true);
          playNotificationSound();
          setTimeout(() => setNewAlert(false), 3000);
        }
        prevCountRef.current = activeCount;
      }
    } catch {
      // silent fail — will retry
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    if (filter !== "stats") return;
    fetch(`${BASE}api/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, [filter]);

  const activeCount = orders.filter(o => o.status !== "listo").length;

  const todayStr = new Date().toLocaleDateString("es-VE");
  const todayOrders = orders.filter(o => new Date(o.createdAt).toLocaleDateString("es-VE") === todayStr);
  const todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);

  useEffect(() => {
    document.title = activeCount > 0 ? `(${activeCount}) Panel del Personal` : "Panel del Personal";
    return () => { document.title = "WifiCafé — Menú"; };
  }, [activeCount]);

  async function updateStatus(id: number, status: string) {
    await fetch(`${BASE}api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  async function deleteOrder(id: number) {
    if (!confirm("¿Eliminar este pedido?")) return;
    await fetch(`${BASE}api/orders/${id}`, { method: "DELETE" });
    fetchOrders();
  }

  const filtered = filter === "activo"
    ? orders.filter(o => o.status !== "listo")
    : filter === "todos"
    ? orders
    : orders.filter(o => o.status === filter);

  const counts = {
    activo:     orders.filter(o => o.status !== "listo").length,
    pendiente:  orders.filter(o => o.status === "pendiente").length,
    pagado:     orders.filter(o => o.status === "pagado").length,
    preparando: orders.filter(o => o.status === "preparando").length,
    listo:      orders.filter(o => o.status === "listo").length,
    todos:      orders.length,
  };

  const pageStyle: CSSProperties = { minHeight: "100vh", background: "#080808", color: "#F0EDE8" };

  if (!unlocked) {
    const dots = Array.from({ length: STAFF_PIN.length }, (_, i) => (
      <div key={i} style={{
        width: 14, height: 14, borderRadius: "50%",
        background: pinError ? "#EF4444" : i < pinInput.length ? "#F5A800" : "transparent",
        border: `2px solid ${pinError ? "#EF4444" : i < pinInput.length ? "#F5A800" : "#444"}`,
        transition: "all 0.15s",
      }} />
    ));
    const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&display=swap');`}</style>
        <img src={logoImg} alt="WifiCafé" style={{ width: 72, height: 72, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(245,168,0,0.4))" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, letterSpacing: 3, color: "#F5A800" }}>Panel del Personal</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 3, color: "#555", marginTop: 4 }}>INGRESA TU PIN</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>{dots}</div>
        {pinError && (
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 2, color: "#EF4444" }}>PIN incorrecto</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 12 }}>
          {keys.map((k, i) => k === "" ? (
            <div key={i} />
          ) : (
            <button key={i} onClick={() => k === "⌫" ? handlePinDelete() : handlePinKey(k)}
              style={{
                width: 72, height: 72, borderRadius: 12,
                background: k === "⌫" ? "transparent" : "#161616",
                border: `1px solid ${k === "⌫" ? "#2A2A2A" : "#2A2A2A"}`,
                color: k === "⌫" ? "#555" : "#F0EDE8",
                fontFamily: "'Bebas Neue', cursive",
                fontSize: k === "⌫" ? 22 : 28,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "#F5A800"; (e.target as HTMLButtonElement).style.color = "#F5A800"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "#2A2A2A"; (e.target as HTMLButtonElement).style.color = k === "⌫" ? "#555" : "#F0EDE8"; }}
            >{k}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500&display=swap');

        .order-card { transition: box-shadow 0.2s; }
        .order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.5); }

        .action-btn { transition: all 0.2s; }
        .action-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }

        .del-btn:hover { background: rgba(239,68,68,0.15) !important; border-color: #EF4444 !important; color: #EF4444 !important; }

        .filter-tab { transition: all 0.2s; }
        .filter-tab:hover { border-color: #F5A800 !important; color: #F5A800 !important; }

        @keyframes pulse-new {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,168,0,0.5); }
          50%      { box-shadow: 0 0 0 8px rgba(245,168,0,0); }
        }
        .card-new {
          border-color: #F5A800 !important;
          animation: pulse-new 1.6s ease infinite;
        }

        @keyframes badge-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .badge-new {
          animation: badge-pop 0.35s ease forwards;
          display: inline-block;
          background: #F5A800;
          color: #000;
          font-family: 'Bebas Neue', cursive;
          font-size: 11px;
          letter-spacing: 1.5px;
          padding: 2px 8px;
          border-radius: 3px;
          vertical-align: middle;
          margin-left: 8px;
        }

        @keyframes alert-flash {
          0%,100% { background: #111111; }
          25%,75% { background: rgba(245,168,0,0.08); }
        }
        .header-alert { animation: alert-flash 0.8s ease 3; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spinner { animation: spin 1s linear infinite; display: inline-block; }
      `}</style>

      {/* ── Header ── */}
      <div
        className={newAlert ? "header-alert" : ""}
        style={{
          background: "#111111",
          borderBottom: "1px solid #2A2A2A",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          transition: "background 0.3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={logoImg}
            alt="WifiCafé"
            style={{ width: "48px", height: "48px", objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(245,168,0,0.35))" }}
          />
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "20px", letterSpacing: "2px", color: "#F5A800", lineHeight: 1 }}>
              Panel del Personal
              {activeCount > 0 && (
                <span style={{ marginLeft: "10px", background: "rgba(245,168,0,0.15)", border: "1px solid rgba(245,168,0,0.4)", color: "#F5A800", fontFamily: "'Bebas Neue', cursive", fontSize: "14px", letterSpacing: "1px", padding: "1px 8px", borderRadius: "3px", verticalAlign: "middle" }}>
                  {activeCount} activo{activeCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "2px", color: "#555", marginTop: "2px" }}>
              {lastFetch
                ? <><span className="spinner" style={{ fontSize: "9px", marginRight: "4px" }}>↻</span>cada 5s · {timeAgo(lastFetch.toISOString())}</>
                : "Cargando..."}
            </div>
          </div>
        </div>
        <a
          href="/"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "12px", letterSpacing: "2px",
            color: "#888", textDecoration: "none",
            border: "1px solid #2A2A2A", padding: "7px 16px",
            borderRadius: "4px",
          }}
        >
          ← Menú
        </a>
      </div>

      {/* ── New order flash banner ── */}
      {newAlert && (
        <div style={{
          background: "#F5A800", color: "#000",
          fontFamily: "'Bebas Neue', cursive", fontSize: "16px", letterSpacing: "3px",
          textAlign: "center", padding: "8px",
        }}>
          🔔 NUEVO PEDIDO RECIBIDO
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: "6px", padding: "14px 20px", overflowX: "auto", scrollbarWidth: "none", flexWrap: "wrap" }}>
        {[
          { key: "activo",     label: "Activos",    withCount: true },
          { key: "pendiente",  label: "Sin Pago",   withCount: true },
          { key: "pagado",     label: "Pagado",     withCount: true },
          { key: "preparando", label: "Preparando", withCount: true },
          { key: "listo",      label: "Listos",     withCount: true },
          { key: "todos",      label: "Todos",      withCount: true },
          { key: "fotos",      label: "🖼 Fotos",   withCount: false },
          { key: "stats",      label: "📊 Stats",   withCount: false },
        ].map(tab => (
          <button
            key={tab.key}
            className="filter-tab"
            onClick={() => setFilter(tab.key)}
            style={{
              background: filter === tab.key ? "rgba(245,168,0,0.08)" : "none",
              border: `1px solid ${filter === tab.key ? "#F5A800" : "#2A2A2A"}`,
              color: filter === tab.key ? "#F5A800" : "#555",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "12px", letterSpacing: "2px",
              padding: "6px 14px", borderRadius: "4px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {tab.withCount && (
              <span style={{ marginLeft: "6px", background: filter === tab.key ? "rgba(245,168,0,0.2)" : "#1C1C1C", color: filter === tab.key ? "#F5A800" : "#555", borderRadius: "3px", padding: "0 5px", fontSize: "11px" }}>
                {counts[tab.key as keyof typeof counts] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Daily summary ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d0d0d", borderTop: "1px solid #2A2A2A", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 40 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>📊 Ventas hoy</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#F5A800", letterSpacing: "1px", lineHeight: 1 }}>{formatPrice(todayTotal)}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>Pedidos</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#888", lineHeight: 1 }}>{todayOrders.length}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>Activos</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: activeCount > 0 ? "#F5A800" : "#555", lineHeight: 1 }}>{activeCount}</div>
        </div>
      </div>

      {/* ── Shared photo input ── */}
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />

      {/* ── Photo management grid ── */}
      {filter === "fotos" && (
        <div style={{ padding: "0 20px 100px" }}>
          <div style={{ padding: "20px 0 12px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", letterSpacing: "3px", color: "#555", textTransform: "uppercase" }}>
            Toca una miniatura para cargar o cambiar la foto del producto
          </div>
          {IMAGE_SECTIONS.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: "28px" }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "18px", letterSpacing: "2px", color: "#F5A800", marginBottom: "12px", borderBottom: "1px solid #1C1C1C", paddingBottom: "6px" }}>
                {section}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                {items.map(({ key, label }) => {
                  const img = getImage(key);
                  return (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <button
                        onClick={() => handlePhotoThumb(key)}
                        title="Cargar foto"
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: img ? "2px solid #3A3A3A" : "2px dashed #2A2A2A",
                          background: "#111",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#F5A800"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = img ? "#3A3A3A" : "#2A2A2A"; }}
                      >
                        {img ? (
                          <img src={img} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <span style={{ fontSize: "28px", opacity: 0.25 }}>📷</span>
                        )}
                        {img && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                            className="photo-hover-overlay"
                          >
                            <span style={{ fontSize: "20px" }}>✏️</span>
                          </div>
                        )}
                      </button>
                      {img && (
                        <button
                          onClick={() => removeImage(key)}
                          title="Eliminar foto"
                          style={{ background: "none", border: "1px solid #2A2A2A", color: "#555", fontSize: "10px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px", padding: "3px 0", borderRadius: "4px", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2A2A2A"; (e.currentTarget as HTMLButtonElement).style.color = "#555"; }}
                        >
                          🗑 quitar
                        </button>
                      )}
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "#666", lineHeight: 1.2, textAlign: "center" }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats section ── */}
      {filter === "stats" && (
        <div style={{ padding: "0 20px 100px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "16px 0" }}>
            <div style={{ background: "#161616", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>Ventas 7 días</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "24px", color: "#F5A800", letterSpacing: "1px", lineHeight: 1.2 }}>{formatPrice(stats?.totalWeek ?? 0)}</div>
            </div>
            <div style={{ background: "#161616", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>Pedidos 7 días</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "24px", color: "#F5A800", letterSpacing: "1px", lineHeight: 1.2 }}>{stats?.totalOrders ?? 0}</div>
            </div>
          </div>

          <div style={{ background: "#161616", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "16px 20px", marginBottom: "14px" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", letterSpacing: "2px", color: "#F5A800", marginBottom: "14px" }}>Ventas por Día (Bs.)</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats?.salesByDay ?? []} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Total"]} contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: "6px", color: "#F0EDE8", fontFamily: "'Barlow Condensed', sans-serif" }} cursor={{ fill: "rgba(245,168,0,0.06)" }} />
                <Bar dataKey="total" fill="#F5A800" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#161616", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "16px 20px", marginBottom: "14px" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", letterSpacing: "2px", color: "#F5A800", marginBottom: "14px" }}>Pedidos por Hora (7 días)</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stats?.byHour ?? []} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: "6px", color: "#F0EDE8", fontFamily: "'Barlow Condensed', sans-serif" }} cursor={{ fill: "rgba(245,168,0,0.06)" }} />
                <Bar dataKey="count" fill="#7A5200" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {stats?.topProducts && stats.topProducts.length > 0 && (
            <div style={{ background: "#161616", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "16px 20px", marginBottom: "14px" }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", letterSpacing: "2px", color: "#F5A800", marginBottom: "14px" }}>Top Productos (30 días)</div>
              <ResponsiveContainer width="100%" height={Math.max(200, stats.topProducts.length * 32)}>
                <BarChart layout="vertical" data={stats.topProducts} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip formatter={(v: number) => [v, "unidades"]} contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: "6px", color: "#F0EDE8", fontFamily: "'Barlow Condensed', sans-serif" }} cursor={{ fill: "rgba(245,168,0,0.06)" }} />
                  <Bar dataKey="qty" radius={[0, 3, 3, 0]} maxBarSize={22}>
                    {stats.topProducts.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#F5A800" : i === 1 ? "#D49200" : i === 2 ? "#A87000" : "#7A5200"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!stats && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#555" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "2px", fontSize: "14px" }}>Cargando estadísticas...</div>
            </div>
          )}
        </div>
      )}

      {/* ── Orders grid ── */}
      <div style={{ padding: "0 20px 80px", display: filter === "fotos" || filter === "stats" ? "none" : "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#555" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🍽️</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "2px", fontSize: "14px" }}>
              No hay pedidos en esta categoría
            </div>
          </div>
        )}
        {filtered.map(order => {
          const meta = STATUS_META[order.status] ?? STATUS_META.pendiente;
          const isDone = order.status === "listo";
          const orderIsNew = isNew(order.createdAt) && !isDone;
          return (
            <div
              key={order.id}
              className={`order-card${orderIsNew ? " card-new" : ""}`}
              style={{
                background: isDone ? "#0d0d0d" : "#161616",
                border: `1px solid ${isDone ? "#1C1C1C" : "#2A2A2A"}`,
                borderRadius: "10px",
                overflow: "hidden",
                opacity: isDone ? 0.55 : 1,
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px", borderBottom: "1px solid #1C1C1C" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#F5A800", letterSpacing: "1px" }}>
                    #{order.id}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", color: "#F0EDE8", marginLeft: "6px", fontWeight: 700 }}>
                    {order.customerName}
                  </span>
                  {order.tableNumber && (
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "#888", marginLeft: "4px" }}>
                      · {order.tableNumber}
                    </span>
                  )}
                  {order.phone && (
                    <a href={`tel:${order.phone}`} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "#4ADE80", marginLeft: "4px", textDecoration: "none" }}>
                      📞 {order.phone}
                    </a>
                  )}
                  {orderIsNew && <span className="badge-new">NUEVO</span>}
                </div>
                <span style={{ background: meta.bg, color: meta.color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "2px", padding: "3px 10px", borderRadius: "3px", textTransform: "uppercase", flexShrink: 0 }}>
                  {meta.label}
                </span>
              </div>

              {/* Items */}
              <div style={{ padding: "10px 16px" }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ padding: "4px 0", borderBottom: "1px solid #1C1C1C" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", color: "#aaa", flex: 1, paddingRight: "8px" }}>
                        <span style={{ color: "#F5A800", fontWeight: 700 }}>{item.quantity}×</span> {item.itemName}
                      </span>
                      <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "13px", color: "#555", flexShrink: 0 }}>
                        {formatPrice(item.itemPriceNum * item.quantity)}
                      </span>
                    </div>
                    {item.notes && (
                      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "11px", color: "#7A5200", fontStyle: "italic", marginTop: "2px", paddingLeft: "2px" }}>
                        📝 {item.notes}
                      </div>
                    )}
                  </div>
                ))}
                {order.notes && (
                  <div style={{ marginTop: "8px", padding: "7px 10px", background: "rgba(245,168,0,0.06)", borderLeft: "2px solid #7A5200", borderRadius: "0 4px 4px 0" }}>
                    <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: "#999", fontStyle: "italic" }}>📝 {order.notes}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 14px" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#F5A800", letterSpacing: "1px" }}>{formatPrice(order.total)}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "#555", marginTop: "1px" }}>{timeAgo(order.createdAt)}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    className="del-btn"
                    onClick={() => deleteOrder(order.id)}
                    style={{ background: "transparent", border: "1px solid #2A2A2A", color: "#555", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", padding: "7px 11px", borderRadius: "4px", cursor: "pointer", transition: "all 0.2s" }}
                    title="Eliminar pedido"
                  >
                    🗑
                  </button>
                  {meta.next && (
                    <button
                      className="action-btn"
                      onClick={() => updateStatus(order.id, meta.next!)}
                      style={{ background: meta.color, color: "#000", border: "none", fontFamily: "'Bebas Neue', cursive", fontSize: "15px", letterSpacing: "1px", padding: "9px 18px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      {meta.nextLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
