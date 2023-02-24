import { ApiResponse } from "@/types/api";
import { Web3AuthenticationError } from "cardano-web3-utils";
import { STATUS_CODES } from "http";
import { NextApiResponse } from "next";
import uppercamelcase from "uppercamelcase";
import { ValidationError } from "yup";

export function handleError(res: NextApiResponse, err: unknown) {
  let errorJson: ApiResponse;

  if (err instanceof Web3AuthenticationError) {
    errorJson = { message: err.message, code: err.httpErrorCode };
    res.status(err.httpErrorCode).json(errorJson);
  }
  if (err instanceof HTTPError) {
    errorJson = { message: err.message, code: err.statusCode };
    res.status(err.statusCode).json(errorJson);
  } else if (err instanceof ValidationError) {
    errorJson = {
      message: err.errors,
      code: 422
    };
    res.status(422).json(errorJson);
  } else if (err instanceof Error) {
    errorJson = { message: err.message, code: 500 };
    res.status(500).json(errorJson);
  } else {
    errorJson = { message: String(err), code: 500 };
    res.status(500).json(errorJson);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(JSON.stringify(errorJson));
  }
}

export class HTTPError extends Error {
  statusCode: number;

  constructor(code: number, message: string = "") {
    super(message || STATUS_CODES[code]);
    this.name = this.toName(code);
    this.statusCode = code;
  }

  private toName(code: number): string {
    const suffix =
      ((code / 100) | 0) === 4 || ((code / 100) | 0) === 5 ? "error" : "";
    return uppercamelcase(
      String(STATUS_CODES[code]).replace(/error$/i, ""),
      suffix
    );
  }
}
