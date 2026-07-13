import { usermodel } from "../DB/models/user.Model.js";
import { BadrequestError, NotFoundError } from "../utils/error/error_handle.js";
import { redisClient } from "../utils/redis/redis.client.js";
import { revokeTokenKey } from "../utils/redis/redis.servive.js";
import { verifyToken, verifyRefreshToken } from "../utils/token/token.js";

export const TokenType = {
  access: "access",
  refresh: "refresh",
};

export const decodeToken = async (
  authorization,
  tokenType = TokenType.access,
) => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw BadrequestError("in-valid authentication");
  }

  const token = authorization.split(" ")[1];

  if (!token) {
    throw BadrequestError("in-valid authentication");
  }

  const payload =
    tokenType === TokenType.access
      ? verifyToken(token)
      : verifyRefreshToken(token);

  if (!payload) {
    throw BadrequestError("invalid token");
  }

  
  const user_id = payload._id;
  const redisTokenKey = revokeTokenKey(payload._id, payload.jti);

  if (!await redisClient.get(redisTokenKey)) {
    throw BadrequestError("login again");
  }


  const user = await usermodel.findById(user_id);

  if (!user) {
    throw NotFoundError("user not found");
  }

  return { user, decodedToken : payload };
};


export const authMiddleware = async (req, res, next) => {
  try {
    const { user, decodedToken } = await decodeToken(
      req.headers.authorization,
      TokenType.access,
    );
    req.user = user;
    req.decodedToken = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};
export const authorization = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(Number(req.user.role))) {
      return next(BadrequestError("unauthorized - you don't have permission"));
    }
    next();
  };
};
