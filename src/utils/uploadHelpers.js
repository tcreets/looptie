function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export async function createUploadItems(files, uploadSpace) {
  const uploadItems = await Promise.all(
    files.map(async (file) => {
      const dataUrl = await fileToDataUrl(file);

      return {
        id: Date.now() + Math.random(),
        space: uploadSpace,
        image: dataUrl,
        sourceUrl: "",
        caption: "",
        note: "",
        creator: "",
        tags: [],
        favorite: false,
        createdAt: new Date().toISOString(),
        type: file.type.startsWith("video") ? "video" : "upload",
      };
    })
  );

  return uploadItems;
}