import { Web3AuthenticationError } from "cardano-web3-utils";
import { STATUS_CODES } from "http";
import { NextApiResponse } from "next";
import uppercamelcase from "uppercamelcase";
import { ValidationError } from "yup";

export function handleError(res: NextApiResponse, err: unknown) {
  let errorJson;

  if (err instanceof Web3AuthenticationError) {
    errorJson = { errors: [{ msg: err.message }] };
    res.status(err.httpErrorCode).json(errorJson);
  }
  if (err instanceof HTTPError) {
    errorJson = { errors: [{ msg: err.message }] };
    res.status(err.statusCode).json(errorJson);
  } else if (err instanceof ValidationError) {
    errorJson = {
      errors: err.errors.map((error) => {
        return {
          msg: error,
        };
      }),
    };
    res.status(422).json(errorJson);
  } else if (err instanceof Error) {
    errorJson = { errors: [{ msg: err.message }] };
    res.status(500).json(errorJson);
  } else {
    errorJson = { errors: { msg: err } };
    res.status(500).json(errorJson);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(JSON.stringify(errorJson));
  }
}

export class HTTPError extends Error {
  statusCode: number;

  constructor(code: number, message: string) {
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
