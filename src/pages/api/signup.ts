import { NextApiRequest, NextApiResponse } from "next";

import * as yup from "yup";
import { v4 as uuidv4 } from "uuid";

import dbConnect from "@/utils/db";
import i18n from "@/config/i18n";

import UserModel from "@/models/UserModel";

import { sendRegistrationEmailMessage } from "@/utils/email";
import { handleError, HTTPError } from "@/utils/error";
import { handleWeb3Auth } from "@/utils/auth";

const RegisterRequestValidator = yup.object({
  username: yup
    .string()
    .required()
    .min(4)
    .max(20)
    .matches(new RegExp("(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$")),
  name: yup.string().required(),
});

const PayloadValidator = yup.object({ email: yup.string().required().email() });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return handleError(res, new HTTPError(405));
  }

  try {
    await dbConnect();

    i18n.getLocale();
    // Gets locale from header 'Accept-Language'
    const locale = "en";
    const { payload, walletAddress } = handleWeb3Auth<{ email: string }>(
      req,
      "Sign up"
    );

    PayloadValidator.validate(payload);

    const data = await RegisterRequestValidator.validate(req.body, {
      stripUnknown: true,
      abortEarly: false,
    });

    const validUserData =
      (await usernameExists(data.username)) ||
      (await emailExists(payload.email)) ||
      (await walletAddressExists(walletAddress));

    if (!validUserData) {
      const item = await registerUser({
        username: data.username,
        name: data.name,
        walletAddress: walletAddress,
        email: payload.email,
      });
      const userInfo = await setUserInfo(item);
      const response = await returnRegisterToken(item, userInfo);
      sendRegistrationEmailMessage(locale, item);
      res.status(201).json(response);
    }
  } catch (error) {
    handleError(res, error);
  }
}

async function usernameExists(username: string) {
  const user = await UserModel.findOne({
    username,
  });

  if (user) {
    throw new HTTPError(400, "Username already exists");
  }
  return false;
}

/**
 * Checks User model if user with an specific email exists
 * @param {string} email - user email
 */
async function emailExists(email: string) {
  const user = await UserModel.findOne({
    email,
  });

  if (user) {
    throw new HTTPError(400, "Email already exists");
  }
  return false;
}

/**
 * Checks User model if user with an specific wallet address exists
 * @param {string} walletAddress - user wallet address
 */
async function walletAddressExists(walletAddress: string) {
  const user = await UserModel.findOne({
    walletAddress,
  });

  if (user) {
    throw new HTTPError(400, "Wallet address already exists");
  }
  return false;
}

/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
function registerUser(req: any) {
  const user = new UserModel({
    username: req.username,
    name: req.name,
    email: req.email,
    walletAddress: req.walletAddress,
    verification: uuidv4(),
  });
  return user.save();
}

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
function setUserInfo(req: any) {
  let user: any = {
    _id: req._id,
    username: req.username,
    name: req.name,
    email: req.email,
    role: req.role,
    verified: req.verified,
    walletAddress: req.walletAddress,
  };
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== "production") {
    user = {
      ...user,
      verification: req.verification,
    };
  }
  return user;
}

function returnRegisterToken(
  { _id = "", verification = "" }: any,
  userInfo: any = {}
) {
  return new Promise((resolve) => {
    if (process.env.NODE_ENV !== "production") {
      userInfo.verification = verification;
    }
    const data = {
      user: userInfo,
    };
    resolve(data);
  });
}
