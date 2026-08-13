import type { CSSProperties } from "react";
import { useState } from "react";

const PROTEIN_EMOJI: Record<string, string> = {
  "Pollo Crispy":     "🍗",
  "Carne Mechada":    "🥩",
  "Pollo Mechado":    "🫕",
  "Lomo de Cerdo":    "🐷",
  "Milanesa de Pollo":"🍖",
  "Tocineta":         "🥓",
  "Chorizo":          "🌭",
};

interface ProteinPickerProps {
  proteins: string[];
  count: number;
  itemName: string;
  onConfirm: (selected: string[]) => void;
  onClose: () => void;
}

const overlay: CSSProperties = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.85)",
  zIndex: 300, backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "20px",
};

export function ProteinPicker({ proteins, count, itemName, onConfirm, onClose }: ProteinPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(protein: string) {
    setSelected(prev => {
      if (prev.includes(protein)) return prev.filter(p => p !== protein);
      if (prev.length >= count) return prev; // max reached, ignore
      return [...prev, protein];
    });
  }

  const ready = selected.length === count;

  return (
    <div style={overlay} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#161616", border: "1px solid #2A2A2A",
          borderRadius: "12px", width: "100%", maxWidth: "420px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #2A2A2A" }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "11px", letterSpacing: "3px", color: "#7A5200", textTransform: "uppercase", marginBottom: "4px" }}>
            Eligiendo proteína para
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", color: "#F0EDE8" }}>
            {itemName}
          </div>
          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", color: "#888" }}>
              Elige {count === 1 ? "1 proteína" : `${count} proteínas`}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: i < selected.length ? "#F5A800" : "#2A2A2A",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Protein grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "14px" }}>
          {proteins.map(protein => {
            const isSelected = selected.includes(protein);
            const isDisabled = !isSelected && selected.length >= count;
            return (
              <button
                key={protein}
                onClick={() => toggle(protein)}
                disabled={isDisabled}
                style={{
                  background: isSelected ? "rgba(245,168,0,0.15)" : "#1C1C1C",
                  border: `1px solid ${isSelected ? "#F5A800" : "#2A2A2A"}`,
                  borderRadius: "8px",
                  padding: "12px 10px",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.35 : 1,
                  transition: "all 0.18s",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  position: "relative",
                }}
              >
                <span style={{ fontSize: "26px", lineHeight: 1 }}>{PROTEIN_EMOJI[protein] ?? "🍴"}</span>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: isSelected ? "#F5A800" : "#F0EDE8",
                  lineHeight: 1.2,
                }}>
                  {protein}
                </span>
                {isSelected && (
                  <span style={{
                    position: "absolute", top: "6px", right: "8px",
                    fontSize: "11px", color: "#F5A800",
                    fontFamily: "'Bebas Neue', cursive",
                  }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 14px 14px", display: "flex", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: "transparent",
              border: "1px solid #2A2A2A", color: "#888",
              fontFamily: "'Bebas Neue', cursive", fontSize: "16px",
              letterSpacing: "1px", borderRadius: "6px",
              padding: "11px", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => ready && onConfirm(selected)}
            disabled={!ready}
            style={{
              flex: 2,
              background: ready ? "#F5A800" : "#2A2A2A",
              color: ready ? "#000" : "#555",
              border: "none",
              fontFamily: "'Bebas Neue', cursive", fontSize: "18px",
              letterSpacing: "2px", borderRadius: "6px",
              padding: "11px", cursor: ready ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {ready ? "Agregar al Pedido" : `Faltan ${count - selected.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function getProteinCount(desc?: string): number {
  if (!desc) return 0;
  const match = desc.match(/(\d+) Proteín/);
  return match ? parseInt(match[1], 10) : 0;
}
