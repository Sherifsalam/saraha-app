import { usermodel } from "../../DB/models/user.Model.js";
import { BadrequestError } from "../../utils/error/error_handle.js";
import { hash, compare } from "../../utils/security/hashing.js";
import { findByEmail } from "./user.repo.js";

export const SignupService = async (
  firstName,
  lastName,
  email,
  password,
  gender,
) => {
  const IsEmailExist = await usermodel.findOne({ email });
  if (IsEmailExist) {
    throw BadrequestError("Email already exists");
  }

  const ciphertext = await hash(password, "argon2"); // ✅ fixed

  const user = await usermodel.create({
    firstName,
    lastName,
    email,
    password: ciphertext,
    gender,
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

  return { message: `welcome ${user.firstName}`, data: user };
};
