import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import * as userService from "@/services/user";
import mongoose from "mongoose";
import { handleError, HTTPError } from "@/utils/error";
import { ApiDataResponse, ApiResponse } from "@/types/api";
import * as yup from "yup";
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
      try {
        const profilePatchRequest = yup.object({
          name: yup.string().required(),
        });

        const patchData = await profilePatchRequest.validate(req.body, {
          stripUnknown: true,
          abortEarly: false,
        });

        const user = await userService.findUserById(
          new mongoose.Types.ObjectId(token.sub)
        );

        if (user) {
          user.name = patchData.name;
          user.save();
          res.send({ message: "SUCCESS" });
        } else {
          return handleError(res, new HTTPError(422, "USER_ERROR"));
        }
      } catch (e) {
        handleError(res, e);
      }
      break;
    default:
      return handleError(res, new HTTPError(405));
  }
}
