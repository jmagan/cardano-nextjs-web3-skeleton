import { NextApiRequest } from "next";
import i18n from "i18n";
import User from "./user";

export type ApiRequest<T = NextApiRequest> = {
  authInfo: any;
  user: User;
} & NextApiRequest & i18nAPI &
  T;
