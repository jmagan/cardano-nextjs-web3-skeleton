import ChangeWallet from "@/types/changeWallet";
import mongoose, { Model } from "mongoose";
import validator from "validator";


const ChangeWalletSchema = new mongoose.Schema<ChangeWallet>(
  {
    email: {
      type: String,
      validate: {
        validator: (email: string) => validator.isEmail(email),
        message: 'EMAIL_IS_NOT_VALID'
      },
      lowercase: true,
      required: true
    },
    verification: {
      type: String
    },
    used: {
      type: Boolean,
      default: false
    },
    ipRequest: {
      type: String
    },
    browserRequest: {
      type: String
    },
    countryRequest: {
      type: String
    },
    ipChanged: {
      type: String
    },
    browserChanged: {
      type: String
    },
    countryChanged: {
      type: String
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)


export default mongoose.models.ChangeWallet as Model<ChangeWallet, {}, {}, {}, typeof ChangeWalletSchema> || mongoose.model("ChangeWallet", ChangeWalletSchema);