import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import * as userService from "@/services/user";
import mongoose from "mongoose";
import { ApiDataResponse, ApiResponse } from "@/types/api";
import { handleError, HTTPError } from "@/utils/error";
import User from "@/types/user";
import UserModel from "@/models/UserModel";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ApiDataResponse<mongoose.PaginateModel<User>>>
) {
  const token = await getToken({ req });

  if (
    !token ||
    token.sub === undefined ||
    !token.role ||
    token.role !== "admin"
  ) {
    return handleError(res, new HTTPError(401));
  }

  switch (req.method) {
    case "GET":
      res.send({
        message: "SUCCESS",
        data: await userService.findAll(
          Number(req.query.page as string),
          Number(req.query.limit as string),
          req.query["sort[]"],
          req.query["order[]"],
          req.query["filterId[]"],
          req.query["filterValue[]"]
        ),
      } as ApiDataResponse<mongoose.PaginateResult<User>>);
      break;
    case "POST":
      const userToPost = new UserModel({
        name: req.body.name,
        email: req.body.email,
        walletAddress: req.body.walletAddress,
        role: req.body.role,
      });

      await userToPost.save();
      res.send({ message: "SUCCESS" });
      break;
    default:
      return handleError(res, new HTTPError(405));
  }
}
