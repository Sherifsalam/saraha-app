import joi from"joi"
import { Gender } from "../../DB/enums/user.enums.js"


export const signupSchema = {
  body: joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).max(150).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required(),
    gender: joi
      .number()
      .valid(...Object.values(Gender))
      .required(),
    phone: joi.string().required(),
  }),
 
};

export const LoginSchema = {
  body: joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).max(150).required(),
  }),
};