import { ProviderEnum } from "../../DB/enums/user.enums.js";
import { usermodel } from "../../DB/models/user.Model.js";
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



const client = new OAuth2Client();

export const SignupService = async (
  firstName,
  lastName,
  email,
  password,
  gender,
  phone,
) => {
  const IsEmailExist = await usermodel.findOne({ email });
  if (IsEmailExist) {
    throw BadrequestError("Email already exists");
  }

  const ciphertext = await hash(password, "argon2");
  const encryptedPhone = encrypt(phone);

  const user = await usermodel.create({
    firstName,
    lastName,
    email,
    password: ciphertext,
    gender,
    phone: encryptedPhone,
  });

  return { data: user };
};

export const LoginService = async (email, password) => {
  const user = await findByEmail(email);

  if (!user) {
    throw BadrequestError("in-valid credentials");
  }

  const isMatch = await compare(password, user.password, "argon2");
  if (!isMatch) {
    throw BadrequestError("in-valid credentials");
  }
  const token = generateToken({
    _id: user._id,
    email: user.email,
  });

  const refreshtoken = refreshToken({
    _id: user._id,
    email: user.email,
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

    const accesstoken = generateToken({
      _id: user._id,
      email: user.email,
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
      audience: "435031859724-c1icf5n5mugao7dbe8otvnutobdaujv1.apps.googleusercontent.com",
    });

    const googlePayload = ticket.getPayload();
    const { email, given_name: firstName, family_name: lastName, picture } = googlePayload;


    let user = await usermodel.findOne({ email });

    if (user) {
      if (user.provider == ProviderEnum.SYSTEM) {
        return next(BadrequestError("use system login")); 
      }
    } else {
     user = await usermodel.create({
       firstName,
       lastName,
       email,
       provider: ProviderEnum.GOOGLE,
       IsEmailconfirmed: true,
     });

    }

    const token = generateToken({
      _id: user._id,
      email: user.email,
    });

    const refreshtoken = refreshToken({
      _id: user._id,
      email: user.email,
    });


    return SuccessResponse({
      res,
      message: "user logged in successfully",
      data: {
        accesstoken: token,
        refreshtoken,
        user
      },
    });

  } catch (err) {
    next(err);
  }
};