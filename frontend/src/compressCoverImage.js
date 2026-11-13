const MAX_COVER_FILE_BYTES = 10 * 1024 * 1024;
const MAX_COVER_IMAGE_BYTES = 512 * 1024;

export default async function compressCoverImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > MAX_COVER_FILE_BYTES) {
    throw new Error("Choose an image smaller than 10 MB.");
  }

  const image = await new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(element);
    };
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be opened."));
    };
    element.src = objectUrl;
  });

  const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("Your browser could not compress this image.");
  if (blob.size > MAX_COVER_IMAGE_BYTES) {
    throw new Error("The compressed cover must be 512 KB or smaller. Try a smaller image.");
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The compressed image could not be read."));
    reader.readAsDataURL(blob);
  });
}
