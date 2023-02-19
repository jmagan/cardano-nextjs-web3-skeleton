export default interface UserAccess {
  _id: mongoose.Types.ObjectId;
  email: string;
  ip: string;
  browser: string;
  country: string;
}