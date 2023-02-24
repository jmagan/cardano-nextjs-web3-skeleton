import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { v4 as uuidv4 } from "uuid";
import i18n from "@/config/i18n";

import { handleError, HTTPError } from "@/utils/error";
import { prepareToSendEmail } from "@/utils/email";
import { getBrowserInfo, getCountry, getIP } from "@/utils/auth";

import ChangeWalletModel from "@/models/ChangeWalletModel";
import ChangeWallet from "@/types/changeWallet";
import { findUserByEmail } from "@/services/user";

const changeRequestSchema = yup.object({
  email: yup.string().required(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== "POST") {
    return handleError(res, new HTTPError(405));
  }

  try {
    const locale = "en";
    const data = await changeRequestSchema.validate(req.body, {
      stripUnknown: true,
    });
    await findUserByEmail(data.email);
    const item = await saveChangeWallet(req);
    sendChangeWalletEmailMessage(locale, item);
    res.status(200).json(changeWalletResponse(item));
  } catch (error) {
    handleError(res, error);
  }
}

function saveChangeWallet(req: NextApiRequest) {
  const forgot = new ChangeWalletModel({
    email: req.body.email,
    verification: uuidv4(),
    ipRequest: getIP(req),
    browserRequest: getBrowserInfo(req),
    countryRequest: getCountry(req),
  });

  return forgot.save();
}

function sendChangeWalletEmailMessage(locale: string, user: ChangeWallet) {
  i18n.setLocale(locale);
  const subject = i18n.__("changeWallet.SUBJECT");
  const htmlMessage = i18n.__(
    "changeWallet.MESSAGE",
    user.email,
    process.env.FRONTEND_URL!,
    user.verification
  );
  prepareToSendEmail(user, subject, htmlMessage);
}

function changeWalletResponse({ email, verification }: ChangeWallet) {
  let data: any = {
    msg: "RESET_EMAIL_SENT",
    email,
  };
  if (process.env.NODE_ENV !== "production") {
    data = {
      ...data,
      verification,
    };
  }
  return data;
}
