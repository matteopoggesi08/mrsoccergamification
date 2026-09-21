'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { PLAYER_PHOTO_MAX_DIMENSION } from '@/services/storage.service';

/**
 * Ridimensiona l'immagine lato client (canvas) prima dell'invio, per
 * tenere leggero l'upload e uniforme lo storage. Il file risultante
 * (webp, max 512px sul lato lungo) viene messo nell'input hidden "photo"
 * cosi' viaggia con il resto del FormData verso la Server Action.
 */
async function resizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PLAYER_PHOTO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/webp', 0.85)
  );
  return new File([blob], 'photo.webp', { type: 'image/webp' });
}

export function PhotoInput({ defaultPhotoUrl }: { defaultPhotoUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(defaultPhotoUrl ?? null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setPreview(URL.createObjectURL(resized));

    const dt = new DataTransfer();
    dt.items.add(resized);
    if (hiddenInputRef.current) hiddenInputRef.current.files = dt.files;
  }

  return (
    <label className="flex cursor-pointer flex-col items-center gap-2">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <span className="text-xs text-muted-foreground">Foto giocatore</span>
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <input ref={hiddenInputRef} type="file" name="photo" className="hidden" />
    </label>
  );
}
