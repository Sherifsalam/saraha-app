import { Router } from "express";
import multer from "multer";
import { allowedFiles, uploadFiles } from "../../utils/multer/uploadFiles.js";
import { authMiddleware } from "../../middleware/auth.middlewares.js";

const router = Router();
router.patch(
  "/profile-pic",
  authMiddleware,
  uploadFiles({
    destination: "profile-pics",
    fileValidation: allowedFiles.imageMimeTypes,
  }).fields([
    { name: "profile", maxCount: 1 },
    { name: "cover", maxCount: 5 },
  ]),
  async (req, res, next) => {
    try {
      if (req.files?.profile?.[0]) {
        req.user.profile_picture = req.files.profile[0].path;
      }

      if (req.files?.cover?.length) {
        req.user.cover_picture = req.files.cover.map((file) => file.path);
      }

      await req.user.save();

      res.json({
        user: req.user,
      });
    } catch (err) {
      next(err);
    }
  }
);


export default router;
