import { useRef, type CSSProperties } from "react";

interface ComboCardProps {
  badge: string;
  name: string;
  includes: string[];
  price: string;
  onAdd?: () => void;
  imageKey?: string;
  image?: string | null;
  onUploadImage?: (key: string, file: File) => void;
}

const badgeStyle: CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "10px",
  letterSpacing: "3px",
  color: "#F5A800",
  textTransform: "uppercase",
  marginBottom: "4px",
};

const nameStyle: CSSProperties = {
  fontFamily: "'Bebas Neue', cursive",
  fontSize: "22px",
  letterSpacing: "2px",
  color: "#F0EDE8",
  marginBottom: "8px",
};

const includesWrapStyle: CSSProperties = {
  fontSize: "12px",
  color: "#888",
  lineHeight: 1.7,
};

const includesRowStyle: CSSProperties = {
  paddingLeft: "14px",
  position: "relative",
};

const checkStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  color: "#F5A800",
  fontSize: "11px",
};

const footerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "12px",
};

const priceStyle: CSSProperties = {
  fontFamily: "'Bebas Neue', cursive",
  fontSize: "30px",
  color: "#F5A800",
  letterSpacing: "2px",
};

const addBtnStyle: CSSProperties = {
  background: "#F5A800",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  padding: "6px 16px",
  fontFamily: "'Bebas Neue', cursive",
  fontSize: "15px",
  letterSpacing: "1px",
  cursor: "pointer",
  transition: "opacity 0.15s",
};

export function ComboCard({ badge, name, includes, price, onAdd, imageKey, image, onUploadImage }: ComboCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showUpload = !!imageKey && !!onUploadImage;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && imageKey && onUploadImage) {
      onUploadImage(imageKey, file);
    }
    e.target.value = "";
  }

  const hasImage = !!imageKey;
  const canUpload = hasImage && !!onUploadImage;
  const thumbSize = 90;

  const cardStyle: CSSProperties = {
    background: "#161616",
    border: "1px solid #7A5200",
    borderRadius: "8px",
    padding: "18px 20px",
    marginBottom: "14px",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s, box-shadow 0.2s",
    cursor: "default",
  };

  return (
    <div style={cardStyle} className="combo-card-hover">
      {/* accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: "#F5A800" }} />

      {/* Header row: text + optional image */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={badgeStyle}>{badge}</div>
          <div style={nameStyle}>{name}</div>
        </div>

        {hasImage && (
          <>
            {canUpload && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            )}
            {canUpload ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Cargar foto"
                style={{
                  width: `${thumbSize}px`,
                  height: `${thumbSize}px`,
                  flexShrink: 0,
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: image ? "1px solid #3A3A3A" : "1px dashed #3A3A3A",
                  background: "#111",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {image ? (
                  <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <span style={{ fontSize: "26px", opacity: 0.3 }}>📷</span>
                )}
              </button>
            ) : (
              <div
                style={{
                  width: `${thumbSize}px`,
                  height: `${thumbSize}px`,
                  flexShrink: 0,
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: image ? "1px solid #2A2A2A" : "none",
                  background: image ? "transparent" : "#0D0D0D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {image ? (
                  <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <span style={{ fontSize: "24px", opacity: 0.1 }}>🍽️</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Includes */}
      <div style={includesWrapStyle}>
        {includes.map((line, i) => (
          <div key={i} style={includesRowStyle}>
            <span style={checkStyle}>✓</span>
            {line}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <div style={priceStyle}>{price}</div>
        {onAdd && (
          <button style={addBtnStyle} onClick={onAdd}>
            + Agregar
          </button>
        )}
      </div>
    </div>
  );
}
