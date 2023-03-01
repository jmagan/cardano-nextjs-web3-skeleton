import dbConnect from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";
import * as userService from "@/services/user";
import { handleError, HTTPError } from "@/utils/error";
import { ApiResponse } from "@/types/api";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    await dbConnect();

    if (
      req.query.username === undefined ||
      typeof req.query.username !== "string"
    ) {
      return handleError(res, new HTTPError(422, "Missing username parameter"));
    }

    const user = await userService.findUserByUsername(req.query.username);

    if (user) {
      res.send({ message: "Username already exists" });
    } else {
      const regex = new RegExp("(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$");

      if (!regex.test(req.query.username)) {
        res.send({ message: "Invalid username characters" });
      } else {
        res.send({ message: "Valid" });
      }
      
    }
  } catch (e) {
    handleError(res, e);
  }
}
