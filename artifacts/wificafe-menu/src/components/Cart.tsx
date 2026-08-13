import type { CSSProperties } from "react";
import { useState } from "react";

export type CartItem = {
  name: string;
  price: string;
  priceNum: number;
  quantity: number;
  section: string;
};

interface CartProps {
  cart: Record<string, CartItem>;
  onClose: () => void;
  onAdd: (key: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
}

const BASE = import.meta.env.BASE_URL ?? "/";

function formatPrice(num: number): string {
  return num.toLocaleString("es-VE") + "$";
}

const overlay: CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
  zIndex: 200, backdropFilter: "blur(4px)",
};
const drawer: CSSProperties = {
  position: "fixed", top: 0, right: 0, bottom: 0,
  width: "min(420px, 100vw)", background: "#111111",
  zIndex: 201, display: "flex", flexDirection: "column",
  borderLeft: "1px solid #2A2A2A",
};
const drawerHeader: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "20px", borderBottom: "1px solid #2A2A2A",
};
const closeBtn: CSSProperties = {
  background: "none", border: "none", color: "#888",
  fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "4px",
};
const scrollArea: CSSProperties = {
  flex: 1, overflowY: "auto", padding: "0 20px",
};
const footer: CSSProperties = {
  padding: "20px", borderTop: "1px solid #2A2A2A",
  background: "#0d0d0d",
};

const inputStyle: CSSProperties = {
  width: "100%", background: "#1C1C1C", border: "1px solid #2A2A2A",
  borderRadius: "6px", color: "#F0EDE8", padding: "10px 14px",
  fontFamily: "'Barlow', sans-serif", fontSize: "14px",
  outline: "none", marginTop: "6px", boxSizing: "border-box",
};
const labelStyle: CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px",
  letterSpacing: "2px", color: "#888", textTransform: "uppercase",
  display: "block",
};
const requiredDot: CSSProperties = { color: "#F5A800", marginLeft: "3px" };

export function Cart({ cart, onClose, onAdd, onRemove, onClear }: CartProps) {
  const [view, setView] = useState<"cart" | "checkout" | "success">("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mesa, setMesa] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Per-item notes
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const items = Object.entries(cart);
  const total = items.reduce((sum, [, item]) => sum + item.priceNum * item.quantity, 0);
  const count = items.reduce((sum, [, item]) => sum + item.quantity, 0);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  function toggleNote(key: string) {
    setExpandedNote(prev => (prev === key ? null : key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          tableNumber: mesa.trim(),
          notes: notes.trim(),
          items: items.map(([key, item]) => ({
            itemName: item.name,
            itemPrice: item.price,
            itemPriceNum: item.priceNum,
            quantity: item.quantity,
            section: item.section,
            notes: itemNotes[key]?.trim() ?? "",
          })),
        }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      const data = await res.json();
      setOrderId(data.id);
      setView("success");
      onClear();
    } catch {
      alert("Hubo un error al enviar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={overlay} onClick={onClose} />
      <div style={drawer}>
        {/* Header */}
        <div style={drawerHeader}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", letterSpacing: "2px", color: "#F5A800" }}>
              {view === "cart" ? "Tu Pedido" : view === "checkout" ? "Confirmar Pedido" : "¡Pedido Enviado!"}
            </div>
            {view === "cart" && count > 0 && (
              <div style={{ fontSize: "12px", color: "#888", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {count} {count === 1 ? "ítem" : "ítems"}
              </div>
            )}
          </div>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* SUCCESS */}
        {view === "success" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "28px", letterSpacing: "3px", color: "#F5A800", marginBottom: "8px" }}>
              Pedido #{orderId} Recibido
            </div>
            <div style={{ fontSize: "14px", color: "#888", lineHeight: 1.6, marginBottom: "32px" }}>
              Tu pedido fue enviado al personal.<br />En breve lo estarán preparando.
            </div>
            <button
              onClick={onClose}
              style={{ background: "#F5A800", color: "#000", border: "none", borderRadius: "6px", padding: "12px 32px", fontFamily: "'Bebas Neue', cursive", fontSize: "18px", letterSpacing: "2px", cursor: "pointer" }}
            >
              Seguir Viendo el Menú
            </button>
          </div>
        )}

        {/* CART VIEW */}
        {view === "cart" && (
          <>
            <div style={scrollArea}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#555" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛒</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "2px", fontSize: "14px" }}>
                    Tu carrito está vacío
                  </div>
                </div>
              ) : (
                items.map(([key, item]) => (
                  <div key={key} style={{ padding: "12px 0", borderBottom: "1px solid #1C1C1C" }}>
                    {/* Main row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "15px", color: "#F0EDE8", lineHeight: 1.3 }}>
                          {item.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "3px" }}>
                          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", color: "#F5A800" }}>
                            {item.price}
                          </div>
                          {/* Note toggle */}
                          <button
                            onClick={() => toggleNote(key)}
                            style={{
                              background: "none", border: "none", cursor: "pointer", padding: 0,
                              fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px",
                              letterSpacing: "1px", color: itemNotes[key] ? "#F5A800" : "#555",
                              textDecoration: "none", transition: "color 0.15s",
                            }}
                          >
                            📝 {itemNotes[key]
                              ? (itemNotes[key].length > 18 ? itemNotes[key].slice(0, 18) + "…" : itemNotes[key])
                              : "nota"}
                          </button>
                        </div>
                      </div>
                      {/* Qty controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button onClick={() => onRemove(key)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #3A3A3A", background: "#1C1C1C", color: "#F0EDE8", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "18px", color: "#F5A800", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                        <button onClick={() => onAdd(key)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #F5A800", background: "transparent", color: "#F5A800", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                      {/* Subtotal */}
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", color: "#888", minWidth: "70px", textAlign: "right" }}>
                        {formatPrice(item.priceNum * item.quantity)}
                      </div>
                    </div>
                    {/* Note textarea */}
                    {expandedNote === key && (
                      <textarea
                        autoFocus
                        value={itemNotes[key] ?? ""}
                        onChange={e => setItemNotes(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="Ej: sin cebolla, extra salsa..."
                        style={{
                          ...inputStyle,
                          marginTop: "8px", resize: "none", height: "52px",
                          border: "1px solid #3A3A3A", fontSize: "13px",
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div style={footer}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", letterSpacing: "2px", color: "#888", textTransform: "uppercase" }}>Total</span>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "24px", color: "#F5A800" }}>{formatPrice(total)}</span>
                </div>
                <button
                  onClick={() => setView("checkout")}
                  style={{ width: "100%", background: "#F5A800", color: "#000", border: "none", borderRadius: "6px", padding: "14px", fontFamily: "'Bebas Neue', cursive", fontSize: "20px", letterSpacing: "2px", cursor: "pointer" }}
                >
                  Hacer Pedido
                </button>
              </div>
            )}
          </>
        )}

        {/* CHECKOUT VIEW */}
        {view === "checkout" && (
          <>
            <div style={scrollArea}>
              <div style={{ padding: "20px 0 10px" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "3px", color: "#7A5200", textTransform: "uppercase", marginBottom: "12px" }}>
                  Resumen — {count} {count === 1 ? "ítem" : "ítems"}
                </div>
                {items.map(([key, item]) => (
                  <div key={key} style={{ padding: "6px 0", borderBottom: "1px solid #1C1C1C" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", color: "#888" }}>
                        {item.quantity}× {item.name}
                      </span>
                      <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "14px", color: "#F5A800" }}>
                        {formatPrice(item.priceNum * item.quantity)}
                      </span>
                    </div>
                    {itemNotes[key] && (
                      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: "#7A5200", fontStyle: "italic", marginTop: "2px" }}>
                        📝 {itemNotes[key]}
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: "4px" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "2px", color: "#888", textTransform: "uppercase" }}>Total</span>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#F5A800" }}>{formatPrice(total)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} id="order-form" style={{ paddingBottom: "20px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Nombre <span style={requiredDot}>*</span></label>
                  <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" required />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Teléfono / WhatsApp <span style={requiredDot}>*</span></label>
                  <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: 0424-123.4567" type="tel" required />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Mesa (opcional)</label>
                  <input style={inputStyle} value={mesa} onChange={e => setMesa(e.target.value)} placeholder="Ej: Mesa 3, Para llevar..." />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Nota general (opcional)</label>
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota para todo el pedido..." />
                </div>
              </form>
            </div>
            <div style={footer}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setView("cart")}
                  style={{ flex: 1, background: "transparent", color: "#888", border: "1px solid #2A2A2A", borderRadius: "6px", padding: "12px", fontFamily: "'Bebas Neue', cursive", fontSize: "16px", letterSpacing: "1px", cursor: "pointer" }}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  form="order-form"
                  disabled={loading || !canSubmit}
                  style={{ flex: 2, background: loading ? "#7A5200" : "#F5A800", color: "#000", border: "none", borderRadius: "6px", padding: "12px", fontFamily: "'Bebas Neue', cursive", fontSize: "18px", letterSpacing: "2px", cursor: loading || !canSubmit ? "not-allowed" : "pointer", opacity: !canSubmit ? 0.5 : 1 }}
                >
                  {loading ? "Enviando..." : "Confirmar Pedido"}
                </button>
              </div>
              {!canSubmit && (
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "1px", color: "#555", textAlign: "center", marginTop: "8px" }}>
                  Nombre y teléfono son obligatorios
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
