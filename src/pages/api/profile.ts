import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import * as userService from "@/services/user";
import mongoose from "mongoose";
import { handleError, HTTPError } from "@/utils/error";
import { ApiDataResponse, ApiResponse } from "@/types/api";
import User from "@/types/user";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ApiDataResponse<User>>
) {
  const token = await getToken({ req });

  if (!token || token.sub === undefined) {
    return handleError(res, new HTTPError(401));
  }

  switch (req.method) {
    case "GET":
      const getUser = await userService.findUserById(
        new mongoose.Types.ObjectId(token.sub)
      );
      if (!getUser) {
        return handleError(res, new HTTPError(400));
      }
      res.send({
        message: "OK",
        data: getUser,
      });
      break;
    case "PATCH":
      const user = await userService.findUserById(
        new mongoose.Types.ObjectId(token.sub)
      );

      if (user) {
        user.name = req.body.name;
        user.save();
        res.send({ message: "SUCCESS" });
      } else {
        return handleError(res, new HTTPError(422, "USER_ERROR"));
      }
      break;
    default:
      res.status(400).end();
  }
}
