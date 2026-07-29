import { Router } from "express";
import { allowedFiles, uploadFiles } from "../../utils/multer/uploadFiles.js";
import { GetMessages, sendMessage, DeleteMessages } from "./messages.service.js"
import { authMiddleware } from "../../middleware/auth.middlewares.js";

const router = Router();

router.post(
    "/sendMessage",
    uploadFiles({ destination: "messages", fileValidation: allowedFiles.imageMimeTypes }).array('attachments', 5),
    sendMessage
)

router.get("/get_Messages", authMiddleware,GetMessages)
router.delete("/delete_Messages/:id", authMiddleware,DeleteMessages)



export default router