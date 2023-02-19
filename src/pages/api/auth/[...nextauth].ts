import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { web3Auth } from "@/config/auth";
import dbConnect from "@/utils/db";
import * as userService from "@/services/user";
import { AuthHandler } from "next-auth/core";
import { Web3AuthenticationError } from "cardano-web3-utils";

export const credentialProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    key: {
      label: "key",
      type: "text",
    },
    signature: {
      label: "signature",
      type: "text",
    },
  },
  async authorize(credentials, _) {
    await dbConnect();

    if (
      credentials === undefined ||
      !credentials.key ||
      !credentials.signature
    ) {
      throw new Error(
        "Key and/or signature are not present in the request body"
      );
    }

    var key = credentials.key;
    var signature = credentials.signature;

    try {
      const { walletAddress } = web3Auth.authenticate(
        "/api/auth/callback/credentials",
        "Login",
        key,
        signature
      );

      const user = await userService.findUserByWalleAddress(walletAddress);

      if (user) {
        return { id: walletAddress, name: user.name, email: user.email };
      }

      return null;
    } catch (ex) {
      if (ex instanceof Web3AuthenticationError) {
        return null
      } if (typeof ex === "string" || ex instanceof String) {
        throw new Error(String(ex));
      } else if (ex instanceof Error) {
        throw ex;
      } else {
        throw new Error(String(ex));
      }
    }
  },
});

export default NextAuth({
  pages: { signIn: "/signin" },
  providers: [credentialProvider],
});

