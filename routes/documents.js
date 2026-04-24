const express   = require("express");
const router    = express.Router();
const jwt       = require("jsonwebtoken");
const multer    = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Document  = require("../models/document");

const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mediverse-documents",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "heic", "heif", "webp"],
    resource_type: "auto",
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ─── GET /api/documents
router.get("/", auth, async (req, res) => {
  try {
    const docs = await Document.find({ patient: req.user.id })
      .sort({ uploadedAt: -1 });
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/documents/upload
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const title = req.body.title || req.file.originalname;
    const serverUrl = process.env.SERVER_URL || "https://mediverse-0gys.onrender.com";
    const fileUrl   = `${serverUrl}/uploads/${req.file.filename}`;

    const doc = await Document.create({
      patient:    req.user.id,
      title,
      name:       req.file.originalname,
      size:       req.body.size || `${Math.round(req.file.size / 1024)} KB`,
      url:        req.file.path,
      uploadedAt: new Date(),
    });

    res.status(201).json({ document: doc });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── DELETE /api/documents/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      patient: req.user.id,
    });

    if (doc && doc.url) {
      const filename = doc.url.split("/uploads/")[1];
      if (filename) {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
