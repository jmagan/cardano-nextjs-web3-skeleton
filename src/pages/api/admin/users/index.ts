import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import * as yup from "yup";
import * as userService from "@/services/user";
import mongoose from "mongoose";
import { ApiDataResponse, ApiResponse } from "@/types/api";
import { handleError, HTTPError } from "@/utils/error";
import User from "@/types/user";
import UserModel from "@/models/UserModel";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ApiResponse | ApiDataResponse<mongoose.PaginateResult<User>>
  >
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
          Number((req.query.page as string) ?? 0),
          Number((req.query.limit as string) ?? 10),
          req.query["sort[]"],
          req.query["order[]"],
          req.query["filterId[]"],
          req.query["filterValue[]"]
        ),
      } as ApiDataResponse<mongoose.PaginateResult<User>>);
      break;
    case "POST":
      try {
        const userPostRequest = yup.object({
          username: yup
            .string()
            .required()
            .min(4)
            .max(20)
            .matches(
              new RegExp("(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$")
            ),
          name: yup.string().required(),
          email: yup.string().required().email(),
          walletAddress: yup.string().required(),
          role: yup.string().required().oneOf(["admin", "user"]),
        });

        const userPostData = await userPostRequest.validate(req.body, {
          stripUnknown: true,
          abortEarly: false,
        });

        const userWithSameEmail = await userService.findUserByEmail(
          userPostData.email
        );

        if (userWithSameEmail) {
          throw new HTTPError(400, "EMAIL_ALREADY_EXISTS");
        }

        const userWithSameWalletAddress =
          await userService.findUserByWalletAddress(userPostData.walletAddress);

        if (userWithSameWalletAddress) {
          throw new HTTPError(400, "WALLET_ADDRESS_ALREADY_EXISTS");
        }

        const userToPost = new UserModel({
          username: userPostData.username,
          name: userPostData.name,
          email: userPostData.email,
          walletAddress: userPostData.walletAddress,
          role: userPostData.role,
        });

        await userToPost.save();
        res.send({
          message: "SUCCESS",
          data: {
            docs: [userToPost as User],
            totalDocs: 1,
            totalPages: 1,
            limit: 10,
            offset: 0,
            pagingCounter: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      } catch (e) {
        handleError(res, e);
      }
      break;
    default:
      return handleError(res, new HTTPError(405));
  }
}
