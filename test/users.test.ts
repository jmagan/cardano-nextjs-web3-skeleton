import {
  createFakePrivateKey,
  createRewardAddress,
} from "cardano-web3-utils/lib/test-utils";
import faker from "faker";
import { getAdminLoginDetails, getUserLoginDetails } from "./helpers/auth";
import CSL from "@emurgo/cardano-serialization-lib-nodejs";
import { testApiHandler } from "next-test-api-route-handler";
import mongoose from "mongoose";
import cookie from "cookie";
import qs from "qs";

import UserModel from "@/models/UserModel";

import usersHandler from "@/pages/api/admin/users";
import userHandler from "@/pages/api/admin/users/[userId]";
import nextAuthHandler from "@/pages/api/auth/[...nextauth]";
import { ApiDataResponse, ApiResponse } from "@/types/api";
import User from "@/types/user";

const host = "HOST";
const loginDetails = {
  admin: getAdminLoginDetails(host),
  user: getUserLoginDetails(host),
};

const adminPrivateKey = createFakePrivateKey(0);
const adminStakeAddress = createRewardAddress(
  adminPrivateKey,
  CSL.NetworkId.mainnet()
);

const sessionCookies = {
  admin: "",
  user: "",
};

const email = faker.internet.email();
const createdID: string[] = [];

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

function patchSessionCookie(
  sessionCookie: string
): ((req: import("http").IncomingMessage) => void) | undefined {
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
            ...loginDetails.admin,
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
        sessionCookies.admin = res.cookies[0]["next-auth.session-token"];
      },
    });

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
            ...loginDetails.user,
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
        sessionCookies.user = res.cookies[0]["next-auth.session-token"];
      },
    });
  });
});

describe("/GET users", () => {
  it("it should NOT be able to consume the route since no token was sent", async () => {
    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
        });

        expect(res.status).toBe(401);
      },
    });
  });
  it("it should GET all the users", async () => {
    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
        });

        const body = (await res.json()) as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        expect(res.status).toBe(200);
        expect(body.data.docs).toBeInstanceOf(Array);
      },
    });
  });

  it("it should GET the users with filters", async () => {
    await testApiHandler({
      url: "/api/admin/users?filterValue[]=admin&filterId[]=email",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
        });

        const body = (await res.json()) as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        expect(res.status).toBe(200);
        expect(body.data.docs).toBeInstanceOf(Array);
        expect(body.data.docs.length).toBe(1);
        expect(body.data.docs[0].email).toBe("admin@admin.com");
      },
    });
  });
});
describe("/POST user", () => {
  it("it should NOT POST a user without name", async () => {
    const user = {};

    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiResponse;

        expect(res.status).toBe(422);
        expect(body.message).toBeInstanceOf(Array);
      },
    });
  });

  it("it should POST a user ", async () => {
    const user = {
      name: faker.random.words(),
      email,
      walletAddress: faker.random.words(),
      role: "admin",
    };

    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        expect(res.status).toBe(200);
        expect(body.message).toBe("SUCCESS");

        createdID.push(body.data.docs[0]._id);
      },
    });
  });

  it("it should NOT POST a user with email that already exists", async () => {
    const user = {
      name: faker.random.words(),
      email,
      password: faker.random.words(),
      role: "admin",
      walletAddress: faker.random.alphaNumeric(23),
    };
    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        expect(res.status).toBe(400);
        expect(body.message).toBe("EMAIL_ALREADY_EXISTS");
      },
    });
  });

  it("it should NOT POST a user with wallet address that already exists", async () => {
    const user = {
      name: faker.random.words(),
      email: faker.internet.email(),
      password: faker.random.words(),
      walletAddress: adminStakeAddress.to_address().to_bech32(),
      role: "admin",
    };
    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        expect(res.status).toBe(400);
        expect(body.message).toBe("WALLET_ADDRESS_ALREADY_EXISTS");
      },
    });
  });

  it("it should NOT POST a user with not known role", async () => {
    const user = {
      name: faker.random.words(),
      email: faker.internet.email(),
      password: faker.random.words(),
      walletAddress: faker.random.alphaNumeric(23),
      role: faker.random.words(),
    };
    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        expect(res.status).toBe(422);
        expect(body.message[0]).toBe(
          "role must be one of the following values: admin, user"
        );
      },
    });
  });
});
describe("/GET/:id user", () => {
  it("it should GET a user by the given id", async () => {
    const id = createdID.slice(-1).pop();

    if (!id) {
      fail("No user id");
    }

    await testApiHandler({
      url: `/api/admin/users/${id}`,
      params: { userId: id },
      handler: userHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
        });

        const body = (await res.json()) as ApiDataResponse<User>;

        expect(res.status).toBe(200);
        expect(body.data._id).toBe(id);
      },
    });
  });
});

describe("/PATCH/:id user", () => {
  it("it should UPDATE a user given the id", async () => {
    const id = createdID.slice(-1).pop();
    if (!id) {
      fail("No user id");
    }
    const user = {
      name: faker.name.findName(),
      email: "email@email.com",
      role: "admin",
      walletAddress: faker.random.alphaNumeric(23),
    };

    await testApiHandler({
      url: `/api/admin/users/${id}`,
      params: { userId: id },
      handler: userHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<User>;

        expect(res.status).toBe(200);
        expect(body.message).toBe("SUCCESS");
      },
    });
  });
  it("it should NOT UPDATE a user with email that already exists", async () => {
    const id = createdID.slice(-1).pop();
    if (!id) {
      fail("No user id");
    }

    const user = {
      name: faker.random.words(),
      email: "admin@admin.com",
      role: "admin",
      walletAddress: faker.random.alphaNumeric(23),
    };

    await testApiHandler({
      url: `/api/admin/users/${id}`,
      params: { userId: id },
      handler: userHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<User>;

        expect(res.status).toBe(400);
        expect(body.message).toBe("EMAIL_ALREADY_EXISTS");
      },
    });
  });

  it("it should NOT UPDATE a user with wallet address that already exists", async () => {
    const id = createdID.slice(-1).pop();
    if (!id) {
      fail("No user id");
    }

    const user = {
      name: faker.random.words(),
      email: faker.internet.email(),
      role: "admin",
      walletAddress: adminStakeAddress.to_address().to_bech32(),
    };

    await testApiHandler({
      url: `/api/admin/users/${id}`,
      params: { userId: id },
      handler: userHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<User>;

        expect(res.status).toBe(400);
        expect(body.message).toBe("WALLET_ADDRESS_ALREADY_EXISTS");
      },
    });
  });

  it("it should NOT UPDATE another user if not an admin", async () => {
    const id = createdID.slice(-1).pop();
    if (!id) {
      fail("No user id");
    }

    const user = {
      name: faker.random.words(),
      email: "toto@toto.com",
      role: "user",
      walletAddress: faker.random.alphaNumeric(23),
    };
    await testApiHandler({
      url: `/api/admin/users/${id}`,
      params: { userId: id },
      handler: userHandler,
      requestPatcher: patchSessionCookie(sessionCookies.user),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<User>;

        expect(res.status).toBe(401);
      },
    });
  });
});
describe("/DELETE/:id user", () => {
  it("it should DELETE a user given the id", async () => {
    const user = {
      name: faker.random.words(),
      email,
      walletAddress: faker.random.words(),
      role: "admin",
    };

    await testApiHandler({
      url: "/api/admin/users",
      handler: usersHandler,
      requestPatcher: patchSessionCookie(sessionCookies.admin),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const body = (await res.json()) as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        expect(res.status).toBe(200);
        expect(body.message).toBe("SUCCESS");

        const newUserId = body.data.docs[0]._id;

        await testApiHandler({
          url: `/api/admin/users/${newUserId}`,
          params: { userId: newUserId },
          handler: userHandler,
          requestPatcher: patchSessionCookie(sessionCookies.admin),
          test: async ({ fetch }) => {
            const res = await fetch({
              method: "DELETE",
            });

            const body = (await res.json()) as ApiDataResponse<
              mongoose.PaginateResult<User>
            >;

            expect(res.status).toBe(200);
            expect(body.message).toBe("SUCCESS");
          },
        });
      },
    });
  });
});

afterAll(async () => {
  const promises = createdID.map(async (id) => {
    return UserModel.findByIdAndRemove(id);
  });

  await Promise.all(promises);

  await mongoose.connection.close();
});
