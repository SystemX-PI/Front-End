const MAX_UPLOAD_BYTES = 1_000_000;
const MAX_STORED_BYTES = 280_000;
const MAX_EDGE_PIXELS = 1200;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem. Escolha outro arquivo."));
    reader.readAsDataURL(blob);
  });
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error("Não foi possível comprimir a imagem. Escolha outro arquivo."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

export async function prepareBrandImage(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isPng = file.type === "image/png" || extension === "png";
  const isSvg = file.type === "image/svg+xml" || extension === "svg";
  const isJpeg = file.type === "image/jpeg" || extension === "jpg" || extension === "jpeg";
  const isWebp = file.type === "image/webp" || extension === "webp";

  if (!isPng && !isSvg && !isJpeg && !isWebp) {
    throw new Error("Envie uma imagem PNG ou SVG (também aceitamos JPG e WebP).");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("A imagem deve ter no máximo 1 MB.");
  }

  if (!isSvg && file.size <= MAX_STORED_BYTES) {
    return readAsDataUrl(file);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Não foi possível abrir essa imagem. Tente exportá-la como PNG ou SVG.");
  }

  try {
    const initialScale = Math.min(1, MAX_EDGE_PIXELS / Math.max(bitmap.width, bitmap.height));
    let scale = initialScale;
    const canvas = document.createElement("canvas");
    let best: Blob | null = null;

    for (let resize = 0; resize < 6; resize += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Seu navegador não conseguiu preparar a imagem.");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5]) {
        const compressed = await canvasBlob(canvas, "image/webp", quality);
        if (compressed.size <= MAX_STORED_BYTES) return await readAsDataUrl(compressed);
        if (!best || compressed.size < best.size) best = compressed;
      }
      scale *= 0.8;
    }

    if (best && best.size <= MAX_STORED_BYTES) return await readAsDataUrl(best);
    throw new Error("A imagem não pôde ser reduzida ao limite de armazenamento. Escolha uma imagem menor.");
  } finally {
    bitmap.close();
  }
}
