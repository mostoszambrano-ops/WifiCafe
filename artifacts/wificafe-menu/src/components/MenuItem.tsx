import { useRef, type CSSProperties } from "react";

interface MenuItemProps {
  name: string;
  desc?: string;
  price: string;
  separator?: boolean;
  onAdd?: () => void;
  imageKey?: string;
  image?: string | null;
  onUploadImage?: (key: string, file: File) => void;
}

const nameStyle: CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  fontSize: "16px",
  letterSpacing: "0.5px",
  color: "#F0EDE8",
  lineHeight: 1.2,
};

const descStyle: CSSProperties = {
  fontSize: "12px",
  color: "#888",
  lineHeight: 1.4,
  fontWeight: 300,
};

const priceStyle: CSSProperties = {
  fontFamily: "'Bebas Neue', cursive",
  fontSize: "20px",
  letterSpacing: "1px",
  color: "#F5A800",
  whiteSpace: "nowrap",
  paddingTop: "1px",
};

const addBtnStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  border: "1px solid #F5A800",
  background: "transparent",
  color: "#F5A800",
  fontSize: "18px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "all 0.15s",
};

export function MenuItem({ name, desc, price, separator, onAdd, imageKey, image, onUploadImage }: MenuItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: separator ? "18px 0 14px" : "12px 0",
    borderBottom: "1px solid #2A2A2A",
    borderTop: separator ? "1px solid #7A5200" : undefined,
    marginTop: separator ? "10px" : undefined,
    gap: "10px",
    cursor: "default",
    transition: "background 0.15s",
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && imageKey && onUploadImage) {
      onUploadImage(imageKey, file);
    }
    // Reset so the same file can be picked again
    e.target.value = "";
  }

  const hasImage = !!imageKey;
  const canUpload = hasImage && !!onUploadImage;

  const thumbSize = 70;

  return (
    <div style={rowStyle}>
      {/* Thumbnail */}
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
                borderRadius: "7px",
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
                <span style={{ fontSize: "22px", opacity: 0.3 }}>📷</span>
              )}
            </button>
          ) : (
            <div
              style={{
                width: `${thumbSize}px`,
                height: `${thumbSize}px`,
                flexShrink: 0,
                borderRadius: "7px",
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
                <span style={{ fontSize: "20px", opacity: 0.12 }}>🍽️</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...nameStyle, marginBottom: desc ? "2px" : 0 }}>{name}</div>
        {desc && <div style={descStyle}>{desc}</div>}
      </div>

      {/* Price + Add */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={priceStyle}>{price}</div>
        {onAdd && (
          <button
            style={addBtnStyle}
            onClick={onAdd}
            title={`Agregar ${name}`}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
