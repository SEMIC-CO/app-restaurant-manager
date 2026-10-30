import * as React from 'react';
import imageCompression from 'browser-image-compression';
import { productService } from '@/services';
import type { ApiProduct } from '@/types';

/**
 * Pre-compresión antes de subir (Paso 1 del flujo de imágenes):
 *
 * - `maxSizeMB: 1` → ahorra ancho de banda (≤1MB por imagen).
 * - `maxWidthOrHeight: 1920` → recorta dimensiones gigantes de cámara móvil.
 * - `useWebWorker: true` → la compresión no bloquea el hilo principal.
 * - `fileType: 'image/webp'` → formato moderno y ligero (el backend vuelve a
 *   procesarla con `sharp`, que estandariza dimensiones y q80).
 */
export const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp',
};

export type ImageUploadStatus = 'idle' | 'compressing' | 'uploading';

export interface PreparedImage {
  /** Archivo listo para enviar en el campo `file`. */
  file: File;
  /** Object URL para previsualizar; liberar con `URL.revokeObjectURL`. */
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}

/** Comprime/redimensiona una imagen en el navegador antes de subirla. */
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
}

function uploadErrorMessage(msg: string, data: unknown): string {
  if (Array.isArray(data)) return data.join(', ');
  return msg || 'No se pudo subir la imagen.';
}

/**
 * Pre-compresión de imágenes + subida por `FormData`.
 *
 * Uso típico al crear un producto:
 * 1. `prepare(file)` al elegir el archivo (comprime y genera el preview);
 * 2. crear el producto (`productService.create`);
 * 3. `upload(product.id, prepared.file)` → `POST /products/:id/image`.
 *
 * `status` alimenta la UI ("Comprimiendo…", "Subiendo imagen…") y `error`
 * guarda el último mensaje legible.
 */
export function useImageUpload() {
  const [status, setStatus] = React.useState<ImageUploadStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const prepare = React.useCallback(
    async (file: File): Promise<PreparedImage | null> => {
      setStatus('compressing');
      setError(null);
      try {
        const compressed = await compressImage(file);
        return {
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          originalSize: file.size,
          compressedSize: compressed.size,
        };
      } catch {
        setError('No se pudo procesar la imagen.');
        return null;
      } finally {
        setStatus('idle');
      }
    },
    [],
  );

  const upload = React.useCallback(
    async (productId: number, file: File): Promise<ApiProduct | null> => {
      setStatus('uploading');
      setError(null);
      try {
        const resp = await productService.uploadImage(productId, file);
        if (resp.code !== 200 && resp.code !== 201) {
          const data: unknown = resp.data;
          setError(uploadErrorMessage(resp.msg, data));
          return null;
        }
        return resp.data;
      } catch {
        setError('No se pudo conectar con el servidor.');
        return null;
      } finally {
        setStatus('idle');
      }
    },
    [],
  );

  const reset = React.useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { prepare, upload, status, error, reset };
}
