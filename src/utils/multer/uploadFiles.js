import multer from "multer";
import fs from "fs/promises";
import path from "path";

export const allowedFiles = {
  imageMimeTypes: [
    "image/apng",
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/webp",
    "image/x-icon",
  ],
  pdfMimeTypes: [
    "application/pdf",
    "application/x-pdf",
    "application/acrobat",
    "applications/vnd.pdf",
    "text/pdf",
    "text/x-pdf",
  ],
  videoMimeTypes: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-flv",
    "video/x-matroska",
    "video/mpeg",
    "video/3gpp",
    "video/mp2t",
  ],
};

export const uploadFiles = ({
  destination = "general",
  filesize = 5 * 1024 * 1024, // 5 MB
  fileValidation = allowedFiles.imageMimeTypes,
} = {}) => {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const firstLetter = destination.toUpperCase();
      const foldername = path.join("./uploads", firstLetter);

      try {
        await fs.access(foldername);
      } catch (error) {
        console.log("folder not exists");
        await fs.mkdir(foldername, { recursive: true });
      }

      return cb(null, foldername);
    },
    filename: (req, file, cb) => {
      return cb(null, `${Date.now()}_${file.originalname}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (fileValidation.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  };

  return multer({
    storage,
    limits: { fileSize: filesize },
    fileFilter,
  });
};
