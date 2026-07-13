import { Router } from "express";
import {
  SignupService,
  LoginService,
  SendOtpService,
  VerifyOtpService,
  profile,
  refreshtoken,
  socialLogin,
  Logout,
  LogoutFromAllDevices,
} from "./auth.service.js";
import {
  SuccessResponse,
  BadrequestError,
} from "../../utils/error/error_handle.js";
import {
  authMiddleware,
  authorization,
} from "../../middleware/auth.middlewares.js";
import { RoleEnum } from "../../DB/enums/user.enums.js";
import { Validation } from "../../middleware/validation.middleware.js";
import { LoginSchema, signupSchema } from "./auth.validation.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ msg: "hello from the user module" });
});

router.post("/signup", Validation(signupSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, gender, phone } = req.body;
    const { data } = await SignupService(
      firstName,
      lastName,
      email,
      password,
      gender,
      phone,
    );
    return SuccessResponse({ res, data, status: 201 });
  } catch (err) {
    next(err);
  }
});

router.post("/login", Validation(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data, message } = await LoginService(email, password);
    return SuccessResponse({ res, data, message, status: 200 });
  } catch (err) {
    next(err);
  }
});

router.post("/send-otp", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(BadrequestError("email is required"));
    }

    const { message, data } = await SendOtpService(email);
    return SuccessResponse({ res, message, data, status: 200 });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(BadrequestError("email and otp are required"));
    }

    const { message, data } = await VerifyOtpService(email, otp);
    return SuccessResponse({ res, message, data, status: 200 });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/profile",
  authMiddleware,
  authorization([RoleEnum.admin, RoleEnum.user]),
  profile,
);

router.post("/refresh-token", refreshtoken);

router.post("/signup/gmail", socialLogin);

router.post("/logout", authMiddleware, Logout);

router.post( "/logout-all",authMiddleware,LogoutFromAllDevices);

export default router;
