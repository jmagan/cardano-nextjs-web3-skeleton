import User from "@/types/user";
import mongoose, { Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import validator from "validator";

const UserSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      validate: {
        validator: (val: string) => validator.isEmail(val),
        message: "EMAIL_IS_NOT_VALID",
      },
      lowercase: true,
      unique: true,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    verification: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

UserSchema.plugin(mongoosePaginate);
export default mongoose.models.User as Model<User, {}, {}, {}, typeof UserSchema> || mongoose.model<User>("User", UserSchema);
