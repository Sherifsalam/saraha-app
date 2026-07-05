import { usermodel } from "../DB/models/user.Model.js";
import { BadrequestError, NotFoundError } from "../utils/error/error_handle.js";
import { verifyToken } from "../utils/token/token.js";

export const authMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(BadrequestError("in-valid authentication"));
  }

  const token = authorization.split(" ")[1];

  const payload = verifyToken(token);

  if (!payload) {
    return next(BadrequestError("invalid token"));
  }

  const user_id = payload._id;
  const user = await usermodel.findById(user_id);

  if (!user) {
    return next(NotFoundError("user not found"));
  }
  req.user = user;
  next();
};

export const authorization = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(Number(req.user.role))) { 
            return next(BadrequestError("unauthorized - you don't have permission"));
        }
        next();
    }
}