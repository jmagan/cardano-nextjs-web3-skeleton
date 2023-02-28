import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import * as yup from "yup";
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

  if (
    !token ||
    token.sub === undefined ||
    !token.role ||
    token.role !== "admin"
  ) {
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
      break;
    case "PATCH":
      try {
        const userPatchRequest = yup.object({
          name: yup.string().required(),
          email: yup.string().required().email(),
          walletAddress: yup.string().required(),
          role: yup.string().required().oneOf(["admin", "user"]),
        });

        const usePatchData = await userPatchRequest.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });

        const user = await userService.findUserById(
          new mongoose.Types.ObjectId(userId)
        );

        const userSameEmail = await userService.findUserByEmail(
          usePatchData.email
        );

        if (userSameEmail && userSameEmail._id !== user?._id) {
          throw new HTTPError(400, "EMAIL_ALREADY_EXISTS");
        }

        const userSameWalletAddress = await userService.findUserByWalletAddress(
          usePatchData.walletAddress
        );

        if (userSameWalletAddress && userSameWalletAddress._id !== user?._id) {
          throw new HTTPError(400, "WALLET_ADDRESS_ALREADY_EXISTS");
        }

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
      } catch (e) {
        return handleError(res, e);
      }
      break;
    default:
      return handleError(res, new HTTPError(405));
  }
}
