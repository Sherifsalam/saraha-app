import mongoose from "mongoose";
import { decrypt, encrypt } from "../../utils/security/encryption.js";
import { Gender, ProviderEnum, RoleEnum } from "../enums/user.enums.js";

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
      required: function() {
        return this.provider === ProviderEnum.SYSTEM;
    },
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
    phone:{
      type: String,
      set:function(value){
        return encrypt(value)
      },
      get:function(value){
        if(value){
          return decrypt(value)
        }
      }
    },
    role: {
        type: Number,
        enum: Object.values(RoleEnum),
        default: RoleEnum.user  
    },
    profile_picture:{
      type:String
    },
    cover_picture:{
      type:[String]

    },
    IsEmailconfirmed: {
      type: Boolean,
      default: false,
    },
    Credential_changed_at: {
      type: Date,
      default: null,
    },
    provider:{
      type:Number,
      enum:Object.values(ProviderEnum),
      default: ProviderEnum.SYSTEM
    }
  
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