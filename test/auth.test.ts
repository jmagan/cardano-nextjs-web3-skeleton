import { getAdminLoginDetails } from "./helpers/auth/getAdminLoginDetails";
import { testApiHandler } from "next-test-api-route-handler";
import { createCOSESign1Signature } from "./helpers/auth/createCOSESign1Signature";
import { createCOSEKey } from "./helpers/auth/createCOSEKey";
import { createFakePrivateKey } from "./helpers/auth/createFakePrivateKey";
import { createRewardAddress } from "./helpers/auth/createRewardAddress";
import faker from "faker";
import mongoose, { ObjectId } from "mongoose";
import CSL from "@emurgo/cardano-serialization-lib-nodejs";
import qs from "qs";
import cookie from "cookie";

import UserModel from "@/models/UserModel";

import nextAuthHandler from "@/pages/api/auth/[...nextauth]";
import signUpHandler from "@/pages/api/signup";
import verifyHandler from "@/pages/api/verify";
import changeHandler from "@/pages/api/change";
import resetHandler from "@/pages/api/reset";

const host = process.env.NEXT_PUBLIC_HOST;

const loginDetails = getAdminLoginDetails(host);

const adminPrivateKey = createFakePrivateKey(0);
const adminStakeAddress = createRewardAddress(adminPrivateKey);

const stakePrivateKey1 = createFakePrivateKey(10);
const stakeAddress1 = createRewardAddress(stakePrivateKey1);

const stakePrivateKey2 = createFakePrivateKey(11);
const stakeAddress2 = createRewardAddress(stakePrivateKey2);

const testName = `${faker.name.firstName()} ${faker.name.lastName()}`;
const testEmail = faker.internet.email();

const testEmail2 = faker.internet.email();

/**
 *
 * @param {String} name
 * @param {String} email
 * @param {CSL.RewardAddress} address
 * @param {CSL.PrivateKey} privateKey
 * @returns
 */
const createRegisterUserSignature = (
  email: string,
  address: CSL.RewardAddress,
  privateKey: CSL.PrivateKey
) => {
  const payload = {
    action: "Sign up",
    email,
    timestamp: Date.now(),
    url: host + "/api/signup",
  };

  return createCOSESign1Signature(payload, address, privateKey);
};

let sessionCookie = "";
const createdID: Array<ObjectId> = [];
let verification = "";
let verificationChange = "";
const anotherUser = {
  name: "Another user",
  email: "another@user.com",
};

async function getCsrfToken() {
  let csrfCookies: Array<any> = [];
  let csrfToken: string = "";

  await testApiHandler({
    handler: nextAuthHandler,
    params: { nextauth: ["csrf"] },
    url: "http://localhost:3000/api/auth/csrf",
    test: async ({ fetch }) => {
      const res = await fetch({
        method: "GET",
      });

      const body = await res.json();
      csrfCookies = res.cookies;
      csrfToken = body.csrfToken as string;
    },
  });

  return { csrfCookies, csrfToken };
}

describe("/POST signin", () => {
  it("it should GET token", async () => {
    const { csrfCookies, csrfToken } = await getCsrfToken();

    await testApiHandler({
      handler: nextAuthHandler,
      params: { nextauth: ["callback", "credentials"] },
      url: "http://localhost:3000/api/auth/callback/credentials",
      requestPatcher: (req) => {
        const cookieHeader =
          cookie.serialize(
            "next-auth.csrf-token",
            csrfCookies[0]["next-auth.csrf-token"] as string
          ) +
          "; " +
          cookie.serialize(
            "next-auth.callback-url",
            csrfCookies[1]["next-auth.callback-url"] as string
          );
        req.headers["cookie"] = cookieHeader;
      },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: qs.stringify({
            ...loginDetails,
            redirect: false,
            json: true,
            csrfToken,
          }),
        });

        await expect(res.status).toBe(200);
        await expect(
          res.cookies
            .map((cookie) => cookie["next-auth.session-token"] !== undefined)
            .includes(true)
        ).toBe(true);
        sessionCookie = res.cookies[0]["next-auth.session-token"];
      },
    });
  });

  it("it should NOT verify the payload if it is expired", async () => {
    const payload = {
      url: process.env.NEXT_PUBLIC_HOST + "/api/login",
      action: "Login",
      timestamp:
        Date.now() -
        Number(process.env.PAYLOAD_VALIDITY_IN_SECONDS!) * 1000 -
        1,
    };

    const coseSign1Signature = createCOSESign1Signature(
      payload,
      adminStakeAddress,
      adminPrivateKey
    );
    const coseKey = createCOSEKey(adminPrivateKey);
    const loginDetailsExpiredPayload = {
      key: Buffer.from(coseKey.to_bytes()).toString("hex"),
      signature: Buffer.from(coseSign1Signature.to_bytes()).toString("hex"),
    };

    const { csrfCookies, csrfToken } = await getCsrfToken();
    await testApiHandler({
      handler: nextAuthHandler,
      params: { nextauth: ["callback", "credentials"] },
      url: "http://localhost:3000/api/auth/callback/credentials",
      requestPatcher: (req) => {
        const cookieHeader =
          cookie.serialize(
            "next-auth.csrf-token",
            csrfCookies[0]["next-auth.csrf-token"] as string
          ) +
          "; " +
          cookie.serialize(
            "next-auth.callback-url",
            csrfCookies[1]["next-auth.callback-url"] as string
          );
        req.headers["cookie"] = cookieHeader;
      },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: qs.stringify({
            ...loginDetailsExpiredPayload,
            redirect: false,
            json: true,
            csrfToken,
          }),
        });

        const text =  await res.text();

        expect(res.status).toBe(401);
        expect(text).toBe(
          '{"url":"http://localhost:3000/api/auth/error?error=Expired%20timestamp"}'
        );
      },
    });
  });

  it("it should NOT verify the payload if timestamp is missing", async () => {
    const payload = {
      url: process.env.NEXT_PUBLIC_HOST + "/api/login",
      action: "Login",
    };

    const coseSign1Signature = createCOSESign1Signature(
      payload,
      adminStakeAddress,
      adminPrivateKey
    );
    const coseKey = createCOSEKey(adminPrivateKey);
    const loginDetailsWithoutTimestamp = {
      key: Buffer.from(coseKey.to_bytes()).toString("hex"),
      signature: Buffer.from(coseSign1Signature.to_bytes()).toString("hex"),
    };

    const { csrfCookies, csrfToken } = await getCsrfToken();
    await testApiHandler({
      handler: nextAuthHandler,
      params: { nextauth: ["callback", "credentials"] },
      url: "http://localhost:3000/api/auth/callback/credentials",
      requestPatcher: (req) => {
        const cookieHeader =
          cookie.serialize(
            "next-auth.csrf-token",
            csrfCookies[0]["next-auth.csrf-token"] as string
          ) +
          "; " +
          cookie.serialize(
            "next-auth.callback-url",
            csrfCookies[1]["next-auth.callback-url"] as string
          );
        req.headers["cookie"] = cookieHeader;
      },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: qs.stringify({
            ...loginDetailsWithoutTimestamp,
            redirect: false,
            json: true,
            csrfToken,
          }),
        });

        const text = await res.text();

        expect(res.status).toBe(401);
        expect(text).toBe(
          '{"url":"http://localhost:3000/api/auth/error?error=Invalid%20payload"}'
        );
      },
    });
  });
});

describe("/POST signup", () => {
  it("it should POST register user 1", async () => {
    const user = {
      name: testName,
      key: Buffer.from(createCOSEKey(stakePrivateKey1).to_bytes()).toString(
        "hex"
      ),
      signature: Buffer.from(
        createRegisterUserSignature(
          testEmail,
          stakeAddress1,
          stakePrivateKey1
        ).to_bytes()
      ).toString("hex"),
    };

    await testApiHandler({
      handler: signUpHandler,
      url: "/api/signup",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body).toHaveProperty("user");
        createdID.push(body.user._id);
        verification = body.user.verification;
      },
    });
  });
  it("it should NOT POST a register if wallet address already exists", async () => {
    const user = {
      name: testName,
      key: Buffer.from(createCOSEKey(stakePrivateKey1).to_bytes()).toString(
        "hex"
      ),
      signature: Buffer.from(
        createRegisterUserSignature(
          testEmail2,
          stakeAddress1,
          stakePrivateKey1
        ).to_bytes()
      ).toString("hex"),
    };
    await testApiHandler({
      handler: signUpHandler,
      url: "/api/signup",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body).toHaveProperty("message");
        expect(body.message).toBe("WALLET_ALREADY_EXISTS");
      },
    });
  });
  it("it should NOT POST a register if email already exists", async () => {
    const user = {
      name: testName,
      key: Buffer.from(createCOSEKey(stakePrivateKey1).to_bytes()).toString(
        "hex"
      ),
      signature: Buffer.from(
        createRegisterUserSignature(
          testEmail,
          stakeAddress1,
          stakePrivateKey1
        ).to_bytes()
      ).toString("hex"),
    };
    await testApiHandler({
      handler: signUpHandler,
      url: "/api/signup",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body).toHaveProperty("message");
        expect(body.message).toBe("EMAIL_ALREADY_EXISTS");
      },
    });
  });
});

describe("/POST verify", () => {
  it("it should POST verify", async () => {
    await testApiHandler({
      handler: verifyHandler,
      url: "/api/verify",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            id: verification,
          }),
        });
        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body).toHaveProperty("email");
        expect(body).toHaveProperty("verified");
      },
    });
  });
});

describe("/POST change", () => {
  it("it should POST change", async () => {
    await testApiHandler({
      handler: changeHandler,
      url: "/api/change",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email: testEmail,
          }),
        });
        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body).toHaveProperty("msg");
        expect(body).toHaveProperty("verification");

        verificationChange = body.verification;
      },
    });
  });
});


describe("/POST reset", () => {
  it("it should POST reset", async () => {
    const newPrivateKey = createFakePrivateKey(12);
    const newAddress = createRewardAddress(newPrivateKey);
    const newCoseKey = createCOSEKey(newPrivateKey);
    const newCoseSign1 = createCOSESign1Signature(
      {
        host,
        action: "Reset",
        timestamp: Date.now(),
        url: host + "/api/reset",
      },
      newAddress,
      newPrivateKey
    );

    await testApiHandler({
      handler: resetHandler,
      url: "/api/reset",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            id: verificationChange,
            walletAddress: newAddress.to_address().to_bech32(),
            key: Buffer.from(newCoseKey.to_bytes()).toString("hex"),
            signature: Buffer.from(newCoseSign1.to_bytes()).toString("hex"),
          }),
        });

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body).toHaveProperty("msg");
        expect(body.msg).toBe("WALLET_CHANGED");
      },
    });
  });
});

afterAll(async () => {
  const promises = createdID.map(async (id) => {
    return UserModel.findByIdAndRemove(id);
  });

  await Promise.all(promises);

  console.log("Close connection");
  await mongoose.connection.close();
});
