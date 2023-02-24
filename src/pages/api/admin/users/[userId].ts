import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import * as userService from "@/services/user";
import { handleError, HTTPError } from "@/utils/error";
import { ApiDataResponse, ApiResponse } from "@/types/api";
import User from "@/types/user";
import UserModel from "@/models/UserModel";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ApiDataResponse<User>>
) {
  const token = await getToken({ req });

  if (!token || token.sub === undefined) {
    return handleError(res, new HTTPError(401));
  }

  const { userId } = req.query;
  if (typeof userId !== "string") {
    return handleError(res, new HTTPError(400));
  }

  switch (req.method) {
    case "GET":
      const getUser = await userService.findUserById(
        new mongoose.Types.ObjectId(userId)
      );

      if (!getUser) {
        return handleError(res, new HTTPError(400));
      }
      res.send({
        message: "OK",
        data: getUser,
      });

      break;
    case "DELETE":
      const userToDelete = await userService.findUserById(
        new mongoose.Types.ObjectId(userId)
      );
      if (userToDelete) {
        await userToDelete.delete();
      }
      res.send({ message: "SUCCESS" });
    case "PATCH":
      let user = await userService.findUserById(
        new mongoose.Types.ObjectId(userId)
      );

      if (user) {
        user.name = req.body.name;
        user.email = req.body.email;
        user.walletAddress = req.body.walletAddress;
        user.role = req.body.role;
        try {
          await user.save();
          res.send({ message: "SUCCESS" });
        } catch (e) {
          handleError(res, e);
        }
      } else {
        return handleError(res, new HTTPError(422));
      }
      break;
    default:
      return handleError(res, new HTTPError(405));
  }
}
