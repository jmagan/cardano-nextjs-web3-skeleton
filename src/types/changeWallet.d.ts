export default interface ChangeWallet {
  email: string,
  verification: string,
  used: boolean,
  ipRequest: string,
  browserRequest: string,
  countryRequest: string,
  ipChanged: string,
  browserChanged: string,
  countryChanged: string
}