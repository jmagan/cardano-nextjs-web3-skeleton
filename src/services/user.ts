
import { ObjectId } from "mongoose";
import UserModel from "@/models/UserModel";

export async function findUserById(userId: ObjectId) {
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
