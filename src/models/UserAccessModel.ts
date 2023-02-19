import mongoose, { Model } from "mongoose";
import validator from "validator";
import UserAccess from "@/types/userAccess";

const UserAccessSchema = new mongoose.Schema<UserAccess>(
  {
    email: {
      type: String,
      validate: {
        validator: (email: any) => validator.isEmail(email),
        message: "EMAIL_IS_NOT_VALID",
      },
      lowercase: true,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);


export default mongoose.models.UserAccess as Model<UserAccess> || mongoose.model("UserAccess", UserAccessSchema);
