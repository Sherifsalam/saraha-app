import { Message } from "../../DB/models/messages.model.js";
import { usermodel } from "../../DB/models/user.model.js";
import { BadrequestError,
         NotFoundError, 
         SuccessResponse, 
         UnauthorizedError } from "../../utils/error/error_handle.js";




export const sendMessage = async (req, res, next) => {
    try {
        const { content, To } = req.body;
        const files = req.files;

        console.log("DEBUG -> content:", content, "| files count:", files?.length);

        const receiver = await usermodel.findById(To);
        if (!receiver) {
            return next(NotFoundError("receiver not found"));
        }

        const hasContent = content && content.trim().length > 0;
        const hasFiles = files && files.length > 0;

        if (!hasContent && !hasFiles) {
            return next(BadrequestError("content or attachments is required"));
        }

        const attachments = hasFiles ? files.map(file => file.path) : [];

        const message = await Message.create({
            content: hasContent ? content : undefined,
            attachments,
            reciver: receiver._id,
        });

        return SuccessResponse({
            res,
            data: { message },
        });
    } catch (err) {
        next(err);
    }
};



export const GetMessages = async (req, res, next) => {
  try {
    const user = req.user;
    const messages = await Message.find({
            reciver:user._id
    }).select('-reciver-__V-updateAt')

        return SuccessResponse({
            res,
            data:{
                user:{
                _id: user._id,
                fullname:user.firstName + ""+ user.lastName , 
                messages
                }
            },
        });
    } catch (err) {
        next(err);
    }
};



export const DeleteMessages = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const message = await Message.findById(id);

        if (!message) {
            return next(NotFoundError("message not found"));
        }

        if (message.reciver.toString() != user._id.toString()) {
            return next(UnauthorizedError("you are not authorized to delete this message"));
        }

        await message.deleteOne();

        return SuccessResponse({
            res,
            message: "message deleted successfully",
            data: { message },
        });
    } catch (err) {
        next(err);
    }
};

