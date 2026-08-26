/**
 * Client-side image compression utility using HTML5 Canvas.
 * Downsamples high-resolution photos to web-friendly dimensions and quality.
 *
 * @param {File} file - The image File object from input[type="file"].
 * @param {Object} options - Configuration options.
 * @param {number} [options.maxWidth=800] - Max width in pixels.
 * @param {number} [options.maxHeight=800] - Max height in pixels.
 * @param {number} [options.quality=0.85] - JPEG quality (0 to 1).
 * @returns {Promise<string>} Base64 data URL string.
 */
export function compressImageFile(file, { maxWidth = 800, maxHeight = 800, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided."));
    }

    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please select a valid image file (PNG, JPG, WEBP)."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
