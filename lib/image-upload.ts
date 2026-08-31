export const EVENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const EVENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EVENT_IMAGE_MAX_WIDTH = 1600;

// Downscale large event images and prefer WebP when it is smaller. Browsers
// without createImageBitmap support safely fall back to the original file.
export async function compressEventImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, EVENT_IMAGE_MAX_WIDTH / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export function formatImageSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
