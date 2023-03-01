import mongoose from "mongoose";
import { testApiHandler } from "next-test-api-route-handler";
import cookie from "cookie";
import qs from "qs";

import { getAdminLoginDetails } from "./helpers/auth";

import nextAuthHandler from "@/pages/api/auth/[...nextauth]";
import profileHandler from "@/pages/api/profile";

const host = "HOST";
const loginDetails = getAdminLoginDetails(host);
let sessionCookie = "";

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

function patchSessionCookie():
  | ((req: import("http").IncomingMessage) => void)
  | undefined {
  return (req) => {
    const cookieHeader = cookie.serialize(
      "next-auth.session-token",
      sessionCookie
    );
    req.headers["cookie"] = cookieHeader;
  };
}

describe("/POST login", () => {
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
});

describe("/GET profile", () => {
  it("it should NOT be able to consume the route since no token was sent", async () => {
    await testApiHandler({
      handler: profileHandler,
      url: "/api/profice",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
        });
        expect(res.status).toBe(401);
      },
    });
  });

  it("it should GET profile", async () => {
    await testApiHandler({
      handler: profileHandler,
      url: "/api/profice",
      requestPatcher: patchSessionCookie(),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
        });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.message).toBe("Ok");
      },
    });
  });
});
describe("/PATCH profile", () => {
  it("it should NOT UPDATE profile empty name", async () => {
    const user = {};

    await testApiHandler({
      handler: profileHandler,
      url: "/api/profile",
      requestPatcher: patchSessionCookie(),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });
        const body = await res.json();

        expect(res.status).toBe(422);
        expect(body.message[0]).toBe("name is a required field");
      },
    });
  });

  it("it should UPDATE profile", async () => {
    const user = {
      name: "Test123456",
    };
    await testApiHandler({
      handler: profileHandler,
      url: "/api/profile",
      requestPatcher: patchSessionCookie(),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const text = await res.text();

        const body = JSON.parse(text);
        expect(res.status).toBe(200);
        expect(body.message).toBe("Success");
      },
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
