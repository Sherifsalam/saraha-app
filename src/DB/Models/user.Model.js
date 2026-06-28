import mongoose from "mongoose";
import { encrypt } from "../../utils/security/encryption.js";
import { Gender } from "../enums/user.enums.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 150,
    },
    gender: {
      type: String,
      required: true,
      default: Gender.male,
      enum: Object.values(Gender),
    },
    age: {
      type: Number,
    },
    IsEmailconfirmed: {
      type: Boolean,
      default: false,
    },
    Credential_changed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    validateBeforeSave: true,
    toJSON: {
      virtuals: true,
      getters: true,
    },
    toObject: {
      virtuals: true,
      getters: true,
    },
  },
);

export const usermodel = mongoose.model("User", userSchema);