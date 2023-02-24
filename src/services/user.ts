import mongoose from "mongoose";
import UserModel from "@/models/UserModel";

export async function findUserById(userId: mongoose.Types.ObjectId) {
  const user = await UserModel.findById(userId);

  return user;
}

export async function findUserByEmail(email: string) {
  const user = await UserModel.findOne(
    {
      email,
    },
    "password loginAttempts blockExpires name email role verified verification walletAddress"
  );

  return user;
}

/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
export async function findUserByWalleAddress(walletAddress: string) {
  // TODO: Implement user not found error 404
  const user = await UserModel.findOne(
    {
      walletAddress,
    },
    "loginAttempts blockExpires name email role verified verification walletAddress"
  );

  return user;
}

export async function findAll(
  page: number,
  limit: number,
  sort: string[] | string | undefined,
  order: string[] | string | undefined,
  filterId: string[] | string | undefined,
  filterValue: string[] | string | undefined
) {
  let sortString = "";

  if (typeof sort === "string" && typeof order === "string") {
    sortString = (order === "true" ? "-" : "") + sort;
  } else if (sort instanceof Array && order instanceof Array) {
    sortString = sort
      .map((sort, index) => (order[index] === "true" ? "-" : "") + sort)
      .join(" ");
  }

  const query: any = {};

  if (typeof filterId === "string" && typeof filterValue === "string") {
    query.$and = [{ [filterId]: { $regex: new RegExp(filterValue, 'i') } }];
  } else if (filterId instanceof Array && filterValue instanceof Array) {
    query.$and = filterId.map((filterId, index) => {
      return { [filterId]: { $regex: new RegExp(filterValue[index], 'i') } };
    });
  }

  const users = await UserModel.paginate(query, { page, limit, sort: sortString });

  return users;
}
