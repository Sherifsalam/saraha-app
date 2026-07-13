import { ProviderEnum } from "../../DB/enums/user.enums.js";
import { usermodel } from "../../DB/models/user.Model.js";
import { sendEmail } from "../../utils/Email/sendEmail.js";
import { generateHTML } from "../../utils/Email/template/generateHTML.js";
import { redisClient } from "../../utils/redis/redis.client.js";
import {
  BadrequestError,
  NotFoundError,
  SuccessResponse,
} from "../../utils/error/error_handle.js";
import { encrypt } from "../../utils/security/encryption.js";
import { hash, compare } from "../../utils/security/hashing.js";
import {
  generateToken,
  refreshToken,
  verifyRefreshToken,
  verifyToken,
} from "../../utils/token/token.js";
import { findByEmail } from "./user.repo.js";
import { OAuth2Client } from "google-auth-library";
import { revokeTokenKey } from "../../utils/redis/redis.servive.js";

const client = new OAuth2Client();

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes

const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

const normalizeEmail = (email) => email.toLowerCase().trim();

export const SignupService = async (
  firstName,
  lastName,
  email,
  password,
  gender,
  phone,
) => {
  const normalizedEmail = normalizeEmail(email);

  const IsEmailExist = await usermodel.findOne({ email: normalizedEmail });
  if (IsEmailExist) {
    throw BadrequestError("Email already exists");
  }

  const ciphertext = await hash(password, "argon2");
  const encryptedPhone = encrypt(phone);

  const user = await usermodel.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password: ciphertext,
    gender,
    phone: encryptedPhone,
  });

  const otp = generateOtpCode();

  await redisClient.set(`otp:${normalizedEmail}`, otp, {
    EX: OTP_EXPIRY_SECONDS,
  });

  const html = generateHTML({
    name: firstName,
    otp,
    expiryMinutes: 10,
  });

  await sendEmail({
    to: user.email,
    subject: "Please confirm your email",
    html,
  });

  return {
    data: {
      user,
    },
  };
};

export const SendOtpService = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await usermodel.findOne({ email: normalizedEmail });

  if (!user) {
    throw NotFoundError("user not found");
  }

  const otp = generateOtpCode();

  await redisClient.set(`otp:${normalizedEmail}`, otp, {
    EX: OTP_EXPIRY_SECONDS,
  });

  const html = generateHTML({
    name: user.firstName,
    otp,
    expiryMinutes: 10,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "Your verification code",
    html,
  });

  return {
    message: "OTP sent",
    data: {
      email: normalizedEmail,
      expiresInSeconds: OTP_EXPIRY_SECONDS,
    },
  };
};

export const VerifyOtpService = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);

  const storedOtp = await redisClient.get(`otp:${normalizedEmail}`);

  if (!storedOtp) {
    throw BadrequestError("OTP expired or not found, please request a new one");
  }

  if (storedOtp !== otp) {
    throw BadrequestError("invalid OTP");
  }

  const user = await usermodel.findOneAndUpdate(
    { email: normalizedEmail },
    { IsEmailconfirmed: true },
    { new: true },
  );

  if (!user) {
    throw NotFoundError("user not found");
  }

  await redisClient.del(`otp:${normalizedEmail}`);

  return { message: "email verified successfully", data: user };
};

export const LoginService = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await findByEmail(normalizedEmail);

  if (!user) {
    throw BadrequestError("in-valid credentials");
  }

  const isMatch = await compare(password, user.password, "argon2");
  if (!isMatch) {
    throw BadrequestError("in-valid credentials");
  }

  const { token, jti } = generateToken(
    { _id: user._id, email: user.email },
    { expiresIn: "10m" },
  );

  const { token: refreshtoken, jti: refreshJti } = refreshToken(
    { _id: user._id, email: user.email },
    { expiresIn: "7d" },
  );

  const result = await redisClient.set(revokeTokenKey(user._id, jti), jti, {
    EX: 7 * 24 * 60 * 60,
  });

  return {
    message: "user logged in successfully",
    data: {
      accesstoken: token,
      refreshtoken,
    },
  };
};

export const profile = async (req, res, next) => {
  try {
    const user = req.user;

    return SuccessResponse({
      res,
      message: "user profile retrieved successfully",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const refreshtoken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next(BadrequestError("in-valid authentication"));
    }

    const token = authorization.split(" ")[1];
    const payload = verifyRefreshToken(token);

    if (!payload) {
      return next(BadrequestError("invalid token"));
    }

    const user = await usermodel.findById(payload._id);

    if (!user) {
      return next(NotFoundError("user not found"));
    }

    const { token: accesstoken, jti } = generateToken(
      { _id: user._id, email: user.email },
      { expiresIn: "10m" },
    );

    await redisClient.set(`Users:login:${user._id}:${jti}`, jti, {
      EX: 7 * 24 * 60 * 60,
    });

    return SuccessResponse({
      res,
      data: { accesstoken },
    });
  } catch (err) {
    next(err);
  }
};

export const socialLogin = async (req, res, next) => {
  try {
    const { IdToken } = req.body;

    if (!IdToken) {
      return next(BadrequestError("IdToken is required"));
    }

    const ticket = await client.verifyIdToken({
      idToken: IdToken,
      audience:
        "435031859724-c1icf5n5mugao7dbe8otvnutobdaujv1.apps.googleusercontent.com",
    });

    const googlePayload = ticket.getPayload();
    const {
      email,
      given_name: firstName,
      family_name: lastName,
      picture,
    } = googlePayload;

    const normalizedEmail = normalizeEmail(email);

    let user = await usermodel.findOne({ email: normalizedEmail });

    if (user) {
      if (user.provider == ProviderEnum.SYSTEM) {
        return next(BadrequestError("use system login"));
      }
    } else {
      user = await usermodel.create({
        firstName,
        lastName,
        email: normalizedEmail,
        provider: ProviderEnum.GOOGLE,
        IsEmailconfirmed: true,
      });
    }

    const { token, jti } = generateToken(
      { _id: user._id, email: user.email },
      { expiresIn: "10m" },
    );

    const { token: refreshtoken } = refreshToken(
      { _id: user._id, email: user.email },
      { expiresIn: "7d" },
    );

    await redisClient.set(`Users:login:${user._id}:${jti}`, jti, {
      EX: 7 * 24 * 60 * 60,
    });

    return SuccessResponse({
      res,
      message: "user logged in successfully",
      data: {
        accesstoken: token,
        refreshtoken,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const Logout = async (req, res, next) => {
  const user = req.user;
  const payload = req.decodedToken;
  const key = revokeTokenKey(user._id, payload.jti);

  await redisClient.del(key);

  return SuccessResponse({
    res,
    message: "user logged out successfully",
  });
};




export const LogoutFromAllDevices = async (req, res, next) => {
  const user = req.user;
  const key = await redisClient.keys(`Users:login:${user._id}:*`);

  await redisClient.del(key);

  return SuccessResponse({
    res,
    message: "user logged out successfully",
  });
};