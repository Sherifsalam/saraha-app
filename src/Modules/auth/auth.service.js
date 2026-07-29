import { ProviderEnum } from "../../DB/enums/user.enums.js";
import { usermodel } from "../../DB/models/user.model.js";
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
import {
  confirmEmailKey,
  confirmNewEmailKey,
  forgetPasswordKey,
  revokeTokenKey,
  newEmailKey,
} from "../../utils/redis/redis.servive.js";

const client = new OAuth2Client();

const OTP_EXPIRY_SECONDS = 10 * 60;

const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeEmail = (email) => email.toLowerCase().trim();

export const SignupService = async (firstName, lastName, email, password, gender, phone,) => {
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

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await usermodel.findOne({ email, IsEmailconfirmed: true });

  if (!user) {
    return next(NotFoundError("user not found"));
  }

  const savedOtp = await redisClient.get(forgetPasswordKey(user._id));

  if (savedOtp) {
    const ttl = await redisClient.ttl(forgetPasswordKey(user._id));
    return next(
      BadrequestError(
        `OTP already sent, please wait ${ttl} seconds before requesting again`,
      ),
    );
  }

  const otp = generateOtpCode();

  const html = generateHTML({
    name: user.firstName,
    otp,
    expiryMinutes: 10,
  });

  await redisClient.set(forgetPasswordKey(user._id), otp, {
    EX: OTP_EXPIRY_SECONDS,
  });

  await sendEmail({
    to: user.email,
    subject: "Forget Password",
    html,
  });

  return SuccessResponse({
    res,
    message: "otp sent successfully",
    data: {
      email: user.email,
      expiresInSeconds: OTP_EXPIRY_SECONDS,
    },
  });
};


export const resetPassword = async (req, res, next) => {
  const { otp, password, email } = req.body;

  const user = await usermodel.findOne({ email, IsEmailconfirmed: true });

  if (!user) {
    return next(NotFoundError("user not found"));
  }

  const savedOtp = await redisClient.get(forgetPasswordKey(user._id));

  if (!savedOtp) {
    return next(BadrequestError("send otp first to reset password"));
  }

  if (savedOtp !== otp) {
    return next(BadrequestError("invalid OTP"));
  }

  user.password = await hash(password, "argon2");
  await user.save();

  await redisClient.del(forgetPasswordKey(user._id));

  return SuccessResponse({
    res,
    message: "password reset successfully",
    data: {
      user,
    }
  });
};


export const updatePassword = async (req, res, next) => {
  const user = req.user;
  const { oldPassword, newPassword } = req.body;

  if (await compare(oldPassword, user.password, "argon2") === false) {
    return next(BadrequestError("old password is incorrect"));
  }

  user.password = await hash(newPassword, "argon2");
  await user.save();


  return SuccessResponse({
    res,
    message: "password updated successfully",
    data: {
      user
    }
  })
}


export const updateEmail = async (req, res, next) => {
  const user = req.user
  const { newEmail } = req.body;

  if (!newEmail) {
    return next(BadrequestError("new email is required"));
  }

  if (newEmail === user.email) {
    return next(BadrequestError("new email cannot be the same as the old email"));
  }

  if (await usermodel.findOne({ email: newEmail })) {
    return next(BadrequestError("email already exists"));
  }

  const Oldkey = confirmEmailKey(user._id);
  const Newkey = confirmNewEmailKey(user._id);
  const Oldotp = generateOtpCode();
  const Newotp = generateOtpCode();
  user.confirmEmail = false;

  await redisClient.set(Newkey, Newotp, {
    EX: OTP_EXPIRY_SECONDS
  });

  sendEmail({
    to: newEmail,
    subject: "Confirm your new email",
    html: generateHTML({
      name: user.firstName,
      otp: Newotp,
      expiryMinutes: 10,
    }),
  });

  await redisClient.set(Oldkey, Oldotp, {
    EX: OTP_EXPIRY_SECONDS
  });

  sendEmail({
    to: user.email,
    subject: "Confirm your old email",
    html: generateHTML({
      name: user.firstName,
      otp: Oldotp,
      expiryMinutes: 10,
    }),
  });

  await redisClient.set(newEmailKey(user._id), newEmail)


  return SuccessResponse({
    res,
    message: "OTP sent successfully",
    data: {
      user
    }
  })
}

export const ConfirmUpatEmail = async (req, res, next) => {
  const user = req.user;
  const { oldEmailOtp, newEmailOtp } = req.body;

  const Oldkey = confirmEmailKey(user._id);
  const Newkey = confirmNewEmailKey(user._id);
  const oldOtp = await redisClient.get(Oldkey);
  const newOtp = await redisClient.get(Newkey);

  if (!oldEmailOtp || !newEmailOtp || oldEmailOtp !== oldOtp || newEmailOtp !== newOtp) {
    return next(BadrequestError("invalid OTP"));
  }

  const newEmail = await redisClient.get(newEmailKey(user._id));

  if (!newEmail) {
    return next(BadrequestError("no pending email change found"));
  }

  user.email = newEmail;
  await user.save();

  await redisClient.del(Oldkey);
  await redisClient.del(Newkey);
  await redisClient.del(newEmailKey(user._id));

  return SuccessResponse({
    res,
    message: "Email updated successfully",
    data: {
      user,
    },
  });
};