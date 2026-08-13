import { useState, useCallback } from "react";

const STORAGE_KEY = "wificafe_menu_images_v1";

function loadImages(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function persistImages(images: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {
    // Storage full — silent fail
  }
}

/** Resize + compress an image File to a base64 JPEG string (max 480px side, 78% quality) */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 480;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w >= h) { h = Math.round((h * MAX) / w); w = MAX; }
        else { w = Math.round((w * MAX) / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas context unavailable")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("image load failed")); };
    img.src = objectUrl;
  });
}

export function useMenuImages() {
  const [images, setImages] = useState<Record<string, string>>(loadImages);

  const getImage = useCallback(
    (key: string): string | null => images[key] ?? null,
    [images]
  );

  const uploadImage = useCallback(async (key: string, file: File) => {
    const dataUrl = await compressImage(file);
    setImages((prev) => {
      const next = { ...prev, [key]: dataUrl };
      persistImages(next);
      return next;
    });
  }, []);

  const removeImage = useCallback((key: string) => {
    setImages((prev) => {
      const next = { ...prev };
      delete next[key];
      persistImages(next);
      return next;
    });
  }, []);

  return { getImage, uploadImage, removeImage };
}
