import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { web3Auth } from "@/config/auth";
import dbConnect from "@/utils/db";
import * as userService from "@/services/user";
import { Web3AuthenticationError } from "cardano-web3-utils";
import mongoose from "mongoose";
import type { Session } from "next-auth";

export const authOptions: AuthOptions = {
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
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

          const user = await userService.findUserByWalletAddress(walletAddress);

          if (user) {
            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }

          return null;
        } catch (ex) {
          if (ex instanceof Web3AuthenticationError) {
            return null;
          }
          if (typeof ex === "string" || ex instanceof String) {
            throw new Error(String(ex));
          } else if (ex instanceof Error) {
            throw ex;
          } else {
            throw new Error(String(ex));
          }
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (!token.sub) {
        return session;
      }
      const user = await userService.findUserById(
        new mongoose.Types.ObjectId(token.sub)
      );

      if (!user) {
        return session;
      }
      (session as ExtendedSession).role = token.role as string;
      session.user!.name = user.name;

      return session;
    },
    async jwt({token}) {
      if (!token.sub) {
        return token;
      }
      const user = await userService.findUserById(
        new mongoose.Types.ObjectId(token.sub)
      );

      if (!user) {
        return token;
      }
      token.role = user.role;

      return token;
    }

  },
};

export interface ExtendedSession extends Session {
  role: string;
}

export default NextAuth(authOptions);
