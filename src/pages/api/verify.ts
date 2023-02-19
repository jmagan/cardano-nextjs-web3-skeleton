import { NextApiRequest, NextApiResponse } from "next";
import { HydratedDocument } from "mongoose";
import * as yup from "yup";

import { handleError, HTTPError } from "@/utils/error";

import UserModel from "@/models/UserModel";
import User from "@/types/user";

const verifyRequestSchema = yup.object({
  id: yup.string().required()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(404).send("");
  }
  
  try {
    const data = await verifyRequestSchema.validate(req.body, {stripUnknown: true});

    const user = await verificationExists(data.id);
    if (!user) {
      return new HTTPError(400, 'NOT_FOUND_OR_ALREADY_VERIFIED');
    }
    res.status(200).json(await verifyUser(user));
  } catch (error) {
    handleError(res, error);
  }
}

async function verificationExists(id:string) {

  const user = await UserModel.findOne(
      {
        verification: id,
        verified: false
      });
  
  if (!user) {
    return false;
  } else {
    return user;
  }

}

function verifyUser(user: HydratedDocument<User>) {
    user.verified = true
    return user.save();
}