import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

export const generateToken = (payload, { expiresIn = "10m", ...rest } = {}) => {
  const jti = nanoid();

  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn,
    jwtid: jti,
    ...rest,
  });

  return { token, jti };
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return decoded;
  } catch (error) {
    console.log("JWT ERROR:", error.message);
    return null;
  }
};

export const refreshToken = (payload, { expiresIn = "7d", ...rest } = {}) => {
  const jti = nanoid();

  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn,
    jwtid: jti,
    ...rest,
  });

  return { token, jti };
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    console.log("JWT ERROR:", error.message);
    return null;
  }
};
