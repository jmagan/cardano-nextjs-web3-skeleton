import mongoose from "mongoose";

export default interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  walletAddress: string;
  role: string;
  verification?: string;
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}