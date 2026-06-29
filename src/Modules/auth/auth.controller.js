import { Router } from "express";
import {
  SignupService,
  LoginService,
  profile,
  refreshtoken,
  socialLogin,
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
import joi from "joi";
import { signupSchema } from "./auth.validation.js"; // ✅ fixed filename (was auth.validation.js)

const router = Router();

router.get("/", (req, res) => {
  res.json({ msg: "hello from the user module" });
});

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = signupSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return next(BadrequestError(error.details[0].message)); // ✅ added next()
    }

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

router.post("/login", async (req, res, next) => {
  try {
    const LoginSchema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().min(8).max(150).required(),
    });

    const { error } = LoginSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return next(BadrequestError(error.details[0].message)); // ✅ added next()
    }

    const { email, password } = req.body;
    const { data, message } = await LoginService(email, password);
    return SuccessResponse({ res, data, message, status: 200 });
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

export default router;
