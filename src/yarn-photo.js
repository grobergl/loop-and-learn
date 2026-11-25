export const maxYarnPhotoLength = 900000;

export function validYarnPhoto(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" &&
      value.length <= maxYarnPhotoLength &&
      /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value))
  );
}

// Resize locally so camera photos and screenshots fit browser storage and backups.
export async function prepareYarnPhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Choose a JPG, PNG, or WebP photo or screenshot.");
  if (file.size > 15000000) throw Error("Choose an image smaller than 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(
          Error(
            "That image could not be opened. Try a different photo or screenshot.",
          ),
        );
      image.src = url;
    });
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 60000000
    )
      throw Error(
        "That image is too large. Try a smaller photo or screenshot.",
      );
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      1200 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw Error("Your browser could not prepare this image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const photo = canvas.toDataURL("image/jpeg", quality);
      if (validYarnPhoto(photo)) return photo;
    }
    throw Error(
      "That image still takes too much space. Try a simpler or smaller photo.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
