const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const Document = require("../models/documents");

const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

// ─── Auth middleware
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

// ─── Multer storage setup
// Files are stored in MEDIVERSE/public/uploads/
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const ext    = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, JPG, and PNG files are allowed."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
   fileFilter: (req, file, cb) => {
    // Accept all common mobile formats
    const allowed = [
      "application/pdf",
      "image/jpeg", "image/jpg", "image/png",
      "image/heic", "image/heif", // iPhone formats
      "image/webp",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
  },
});
});

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
      url:        fileUrl,
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
