import { BadrequestError } from "../utils/error/error_handle.js";

const reqData = ["body", "params", "query"];

export const Validation = (schema) => {
  return (req, res, next) => {
    const ValidateErrors = [];

    reqData.forEach((ele) => {
      if (schema[ele]) {
        const ValidateRes = schema[ele].validate(req[ele], {
          abortEarly: false,
        });

        if (ValidateRes.error) {
          ValidateErrors.push(ValidateRes.error.details);
        }
      }
    });

    if (ValidateErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "validation error",
        errors: ValidateErrors,
      });
    }

    return next(); // ✅ critical fix — must call next() when validation passes
  };
};
