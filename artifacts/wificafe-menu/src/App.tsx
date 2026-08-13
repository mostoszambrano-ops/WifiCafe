import { useRef, useState } from "react";
import { MenuItem } from "@/components/MenuItem";
import { ComboCard } from "@/components/ComboCard";
import { Cart, type CartItem } from "@/components/Cart";
import { ProteinPicker, getProteinCount } from "@/components/ProteinPicker";
import { useMenuImages } from "@/hooks/useMenuImages";
import logoImg from "/logo.png";
import {
  proteins, sections, cachapas, burgers, burgers_note, hotdogs,
  burritos, burritos_note, morocho, especiales,
  ensaladas, papas, combos, mega_note, adicionales, bebidas,
} from "@/data/menu";

const PROTEIN_EMOJI: Record<string, string> = {
  "Pollo Crispy":      "🍗",
  "Carne Mechada":     "🥩",
  "Pollo Mechado":     "🫕",
  "Lomo de Cerdo":     "🐷",
  "Milanesa de Pollo": "🍖",
  "Tocineta":          "🥓",
  "Chorizo":           "🌭",
};

function parsePrice(price: string): number {
  return parseInt(price.replace(/\./g, "").replace("$", ""), 10) || 0;
}

type PickerItem = {
  name: string;
  price: string;
  section: string;
  count: number;
};

export default function App() {
  const [activeSection, setActiveSection] = useState("cachapas");
  const navRef = useRef<HTMLDivElement>(null);
  const navWrapRef = useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [pickerItem, setPickerItem] = useState<PickerItem | null>(null);

  const { getImage } = useMenuImages();

  function show(id: string) {
    setActiveSection(id);
    const btn = navRef.current?.querySelector(`[data-id="${id}"]`) as HTMLElement;
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    if (navWrapRef.current) {
      const top = navWrapRef.current.getBoundingClientRect().top + window.scrollY - 10;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  function addToCart(name: string, price: string, section: string) {
    const key = `${section}||${name}`;
    const priceNum = parsePrice(price);
    setCart(prev => ({
      ...prev,
      [key]: {
        name, price, priceNum, section,
        quantity: (prev[key]?.quantity ?? 0) + 1,
      },
    }));
  }

  function handleAdd(name: string, price: string, section: string, desc?: string) {
    const count = getProteinCount(desc);
    if (count > 0) {
      setPickerItem({ name, price, section, count });
    } else {
      addToCart(name, price, section);
    }
  }

  function handleProteinConfirm(selected: string[]) {
    if (!pickerItem) return;
    const fullName = `${pickerItem.name} (${selected.join(", ")})`;
    addToCart(fullName, pickerItem.price, pickerItem.section);
    setPickerItem(null);
  }

  function incrementCart(key: string) {
    setCart(prev => ({
      ...prev,
      [key]: { ...prev[key], quantity: prev[key].quantity + 1 },
    }));
  }

  function decrementCart(key: string) {
    setCart(prev => {
      const next = { ...prev };
      if (next[key].quantity <= 1) delete next[key];
      else next[key] = { ...next[key], quantity: next[key].quantity - 1 };
      return next;
    });
  }

  function clearCart() { setCart({}); }

  const cartCount = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);

  const sectionHeader = (emoji: string, title: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "28px 0 16px" }}>
      <span style={{ fontSize: "26px", lineHeight: 1 }}>{emoji}</span>
      <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "32px", letterSpacing: "3px", color: "#F5A800" }}>{title}</h2>
    </div>
  );

  /** Props shorthand for MenuItem image display (read-only for customers) */
  function imgProps(key: string) {
    return {
      imageKey: key,
      image: getImage(key),
    };
  }

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500&display=swap');
        .combo-card-hover:hover { border-color: #F5A800 !important; box-shadow: 0 0 20px rgba(245,168,0,0.1); }
        .nav-tab-btn {
          flex-shrink: 0; background: none; border: none; color: #555;
          font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase; padding: 14px; cursor: pointer;
          position: relative; transition: color 0.2s; white-space: nowrap;
        }
        .nav-tab-btn::after {
          content: ''; position: absolute; bottom: 0; left: 50%; right: 50%;
          height: 2px; background: #F5A800; transition: left 0.25s, right 0.25s;
        }
        .nav-tab-btn.active { color: #F5A800; }
        .nav-tab-btn.active::after { left: 0; right: 0; }
        .nav-tab-btn:hover:not(.active) { color: #F0EDE8; }
        .drink-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: #111111; border-radius: 6px;
          margin-bottom: 6px; border: 1px solid transparent; transition: all 0.2s;
        }
        .drink-item:hover { border-color: #2A2A2A; background: #161616; }
        .add-item {
          background: #1C1C1C; border: 1px solid #2A2A2A; border-radius: 6px;
          padding: 10px 14px; display: flex; justify-content: space-between;
          align-items: center; transition: all 0.2s;
        }
        .add-item:hover { border-color: #7A5200; background: #161616; transform: translateY(-1px); }
        .section-content { animation: fadeUp 0.35s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .cart-fab {
          position: fixed; bottom: 24px; right: 24px; z-index: 150;
          width: 60px; height: 60px; border-radius: 50%;
          background: #F5A800; border: none; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(245,168,0,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          font-family: 'Bebas Neue', cursive;
        }
        .cart-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(245,168,0,0.5); }
        .mini-add-btn {
          width: 22px; height: 22px; border-radius: 50%;
          border: 1px solid #F5A800; background: transparent; color: #F5A800;
          font-size: 15px; cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0;
        }
        .mini-add-btn:hover { background: #F5A800; color: #000; }
        .protein-card {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: #111111; border: 1px solid #1C1C1C; border-radius: 8px;
          padding: 10px 8px; cursor: default; transition: all 0.22s;
          min-width: 72px;
        }
        .protein-card:hover {
          border-color: #7A5200;
          background: rgba(245,168,0,0.07);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(245,168,0,0.15);
        }
        .protein-card:hover .protein-name { color: #F5A800; }
      `}</style>

      {/* HEADER */}
      <header style={{ position: "relative", textAlign: "center", padding: "48px 20px 36px", borderBottom: "1px solid #2A2A2A", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)", width: "320px", height: "200px", background: "radial-gradient(ellipse, rgba(245,168,0,.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-1px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "2px", background: "#F5A800" }} />
        <img
          src={logoImg}
          alt="WifiCafé"
          style={{ width: "150px", height: "150px", objectFit: "contain", margin: "0 auto 10px", display: "block", filter: "drop-shadow(0 0 24px rgba(245,168,0,0.45))" }}
        />
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "5px", color: "#888", textTransform: "uppercase", marginBottom: "14px" }}>Comida Rica · Señal Fuerte</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="https://www.instagram.com/wificafe.sc?igsh=MTRsOGliMGNhOW15Mg%3D%3D&utm_source=qr"
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(245,168,0,0.08)", border: "1px solid rgba(245,168,0,0.25)", borderRadius: "20px", padding: "5px 14px", color: "#F5A800", textDecoration: "none", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "1.5px", transition: "all 0.2s" }}
          >
            <span style={{ fontSize: "14px" }}>📸</span> @wificafe.sc
          </a>
          <a
            href="https://wa.me/584247126151"
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "20px", padding: "5px 14px", color: "#25D366", textDecoration: "none", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "1.5px", transition: "all 0.2s" }}
          >
            <span style={{ fontSize: "14px" }}>💬</span> WhatsApp
          </a>
          <a
            href="tel:+584247126151"
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid #2A2A2A", borderRadius: "20px", padding: "5px 14px", color: "#888", textDecoration: "none", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "1.5px" }}
          >
            <span style={{ fontSize: "14px" }}>📞</span> 0424-712.6151
          </a>
        </div>
      </header>

      {/* PROTEINS — interactive cards */}
      <div style={{ background: "#0D0D0D", borderBottom: "1px solid #2A2A2A", padding: "18px 20px" }}>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", letterSpacing: "4px", color: "#7A5200", textTransform: "uppercase", marginBottom: "12px", textAlign: "center" }}>
          Proteínas disponibles
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          {proteins.map(p => (
            <div key={p} className="protein-card">
              <span style={{ fontSize: "22px", lineHeight: 1 }}>{PROTEIN_EMOJI[p] ?? "🍴"}</span>
              <span className="protein-name" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 600, color: "#888", letterSpacing: "0.5px", textAlign: "center", lineHeight: 1.2, transition: "color 0.22s" }}>
                {p}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* NAV */}
      <div ref={navWrapRef} style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,8,8,.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2A2A2A" }}>
        <div style={{ textAlign: "center", fontSize: "11px", color: "#555", padding: "6px", letterSpacing: "1px", fontFamily: "'Barlow Condensed', sans-serif" }}>← desliza →</div>
        <nav ref={navRef} style={{ display: "flex", overflowX: "auto", padding: "0 12px", gap: "2px", scrollbarWidth: "none" }}>
          {sections.map(s => (
            <button key={s.id} data-id={s.id} className={`nav-tab-btn${activeSection === s.id ? " active" : ""}`} onClick={() => show(s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN */}
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "0 14px 100px" }}>

        {activeSection === "cachapas" && (
          <div className="section-content">
            {sectionHeader("🌽", "Cachapas")}
            {cachapas.map((item, i) => (
              <MenuItem key={i} {...item}
                {...imgProps(item.name)}
                onAdd={() => handleAdd(item.name, item.price, "cachapas", item.desc)}
              />
            ))}
          </div>
        )}

        {activeSection === "burgers" && (
          <div className="section-content">
            {sectionHeader("🍔", "Hamburguesas")}
            <p style={{ fontSize: "12px", color: "#888", margin: "-10px 0 16px", padding: "10px 14px", borderLeft: "2px solid #7A5200", fontStyle: "italic", lineHeight: 1.5 }}>🍟 {burgers_note}</p>
            {burgers.map((item, i) => (
              <MenuItem key={i} {...item}
                {...imgProps(item.name + (item.desc ? `__${item.desc}` : ""))}
                onAdd={() => handleAdd(item.name, item.price, "burgers", item.desc)}
              />
            ))}
          </div>
        )}

        {activeSection === "hotdogs" && (
          <div className="section-content">
            {sectionHeader("🌭", "Perros Calientes")}
            {hotdogs.map((item, i) => (
              <MenuItem key={i} {...item}
                {...imgProps(item.name + (item.desc ? `__${item.desc}` : ""))}
                onAdd={() => handleAdd(item.name, item.price, "hotdogs", item.desc)}
              />
            ))}
          </div>
        )}

        {activeSection === "burritos" && (
          <div className="section-content">
            {sectionHeader("🌯", "Burritos")}
            <p style={{ fontSize: "12px", color: "#888", margin: "-10px 0 16px", padding: "10px 14px", borderLeft: "2px solid #7A5200", fontStyle: "italic", lineHeight: 1.5 }}>{burritos_note}</p>
            {burritos.map((item, i) => (
              <MenuItem key={i} {...item}
                {...imgProps(item.name + (item.desc ? `__${item.desc}` : ""))}
                onAdd={() => handleAdd(item.name, item.price, "burritos", item.desc)}
              />
            ))}
          </div>
        )}

        {activeSection === "morocho" && (
          <div className="section-content">
            {sectionHeader("🥙", "Morocho")}
            {morocho.map((item, i) => (
              <ComboCard key={i} {...item}
                {...imgProps(item.name)}
                onAdd={() => addToCart(item.name, item.price, "morocho")}
              />
            ))}
          </div>
        )}

        {activeSection === "especiales" && (
          <div className="section-content">
            {sectionHeader("⭐", "Especiales")}
            {especiales.map((item, i) => (
              <ComboCard key={i} {...item}
                {...imgProps(item.name)}
                onAdd={() => handleAdd(item.name, item.price, "especiales", item.includes[0])}
              />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 0 10px" }}>
              <span style={{ fontSize: "22px" }}>🥗</span>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", letterSpacing: "3px", color: "#F5A800" }}>Ensaladas</h2>
            </div>
            {ensaladas.map((item, i) => (
              <ComboCard key={i} {...item}
                {...imgProps(item.name)}
                onAdd={() => addToCart(item.name, item.price, "ensaladas")}
              />
            ))}
          </div>
        )}

        {activeSection === "papas" && (
          <div className="section-content">
            {sectionHeader("🍟", "Papas")}
            {papas.map((item, i) => (
              <MenuItem key={i} {...item}
                {...imgProps(item.name)}
                onAdd={() => addToCart(item.name + (item.desc ? ` (${item.desc})` : ""), item.price, "papas")}
              />
            ))}
          </div>
        )}

        {activeSection === "combos" && (
          <div className="section-content">
            {sectionHeader("🔥", "Combos")}
            <div style={{ background: "rgba(245,168,0,0.06)", border: "1px solid rgba(245,168,0,0.2)", borderRadius: "6px", padding: "8px 14px", marginBottom: "12px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "#F5A800", letterSpacing: "1px" }}>
              ⭐ {mega_note}
            </div>
            {combos.map((item, i) => (
              <ComboCard key={i} {...item}
                {...imgProps(item.name)}
                onAdd={() => handleAdd(item.name, item.price, "combos", item.desc)}
              />
            ))}
          </div>
        )}

        {activeSection === "adicionales" && (
          <div className="section-content">
            {sectionHeader("➕", "Adicionales")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
              {adicionales.map((item, i) => (
                <div key={i} className="add-item">
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "14px", color: "#F0EDE8" }}>{item.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", color: "#F5A800" }}>{item.price}</span>
                    <button className="mini-add-btn" onClick={() => addToCart(item.name, item.price, "adicionales")}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "bebidas" && (
          <div className="section-content">
            {sectionHeader("🥤", "Bebidas")}
            {bebidas.map((item, i) => (
              <div key={i} className="drink-item">
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "15px", color: "#F0EDE8" }}>{item.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "18px", color: "#F5A800" }}>{item.price}</span>
                  <button className="mini-add-btn" onClick={() => addToCart(item.name, item.price, "bebidas")}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "30px 20px", borderTop: "1px solid #2A2A2A", color: "#555", fontSize: "12px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "2px" }}>
        <strong style={{ color: "#F5A800" }}>WifiCafé</strong> · @wificafe.sc · 0424-712.6151
        <br />
        <a href="/staff" style={{ color: "#2A2A2A", fontSize: "10px", marginTop: "10px", display: "inline-block", textDecoration: "none" }}>Panel del personal</a>
      </footer>

      {/* FLOATING CART BUTTON */}
      {cartCount > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          <span style={{ fontSize: "22px" }}>🛒</span>
          <span style={{ fontSize: "13px", color: "#000", fontFamily: "'Bebas Neue', cursive", letterSpacing: "1px" }}>{cartCount}</span>
        </button>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <Cart
          cart={cart}
          onClose={() => setCartOpen(false)}
          onAdd={incrementCart}
          onRemove={decrementCart}
          onClear={clearCart}
        />
      )}

      {/* PROTEIN PICKER MODAL */}
      {pickerItem && (
        <ProteinPicker
          proteins={proteins}
          count={pickerItem.count}
          itemName={pickerItem.name}
          onConfirm={handleProteinConfirm}
          onClose={() => setPickerItem(null)}
        />
      )}
    </div>
  );
}
