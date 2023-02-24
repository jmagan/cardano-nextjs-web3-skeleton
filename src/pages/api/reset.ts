import { NextApiRequest, NextApiResponse } from "next";
import { HydratedDocument } from "mongoose";
import * as yup from "yup";

import {
  getBrowserInfo,
  getCountry,
  getIP,
  handleWeb3Auth,
} from "@/utils/auth";
import { handleError, HTTPError } from "@/utils/error";

import ChangeWalletModel from "@/models/ChangeWalletModel";
import ChangeWallet from "@/types/changeWallet";
import User from "@/types/user";
import { findUserByEmail } from "@/services/user";

const resetRequestSchema = yup.object({
  id: yup.string().required(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return handleError(res, new HTTPError(405));
  }

  try {
    const { walletAddress } = handleWeb3Auth(req, "Reset");

    const data = await resetRequestSchema.validate(req.body, {
      stripUnknown: true,
    });
    const changeWallet = await findChangeWallet(data.id);
    const user = await findUserByEmail(changeWallet.email);

    if (!user) {
      throw new HTTPError(422, "USER_NOT_FOUND");
    }

    await updateWallet(walletAddress, user);
    const result = await markChangeWalletAsUsed(req, changeWallet);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function findChangeWallet(id: string) {
  const changeWallet = await ChangeWalletModel.findOne({
    verification: id,
    used: false,
  });

  if (!changeWallet) {
    throw new HTTPError(400, "NOT_FOUND_OR_ALREADY_USED");
  }

  return changeWallet;
}

async function updateWallet(
  walletAddress: string,
  user: HydratedDocument<User>
) {
  user.walletAddress = walletAddress;
  return await user.save();
}

async function markChangeWalletAsUsed(
  req: NextApiRequest,
  forgot: HydratedDocument<ChangeWallet>
) {
  forgot.used = true;
  forgot.ipChanged = getIP(req)!;
  forgot.browserChanged = getBrowserInfo(req)!;
  forgot.countryChanged = getCountry(req).toString();
  await forgot.save();
  return { msg: "WALLET_CHANGED" };
}
