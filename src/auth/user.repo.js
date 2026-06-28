import { usermodel } from "../../DB/models/user.Model.js";
import { findOne } from "../../DB/db.repo.js";

export const findByEmail = async (email, select = "", options = {}) => {
  const doc = await findOne({
    model: usermodel,
    filter: { email },
    select,
    options,
  });
  return doc;
};
