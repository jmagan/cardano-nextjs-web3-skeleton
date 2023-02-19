import { NextApiRequest } from "next";
import { web3Auth } from "@/config/auth";
import requestIp from "request-ip";


export function handleWeb3Auth<T>(req: NextApiRequest, action: string) {
  
  return web3Auth.authenticate<T>(req.url ?? "", action, req.body.key, req.body.signature);
}

/**
 * Gets IP from user
 * @param {NextApiRequest} req - request object
 */
export function getIP(req: NextApiRequest) {
  return requestIp.getClientIp(req);
}

export function getCountry({ headers }: NextApiRequest) {
  return headers["cf-ipcountry"] ? headers["cf-ipcountry"] : "XX";
}

export function getBrowserInfo({ headers }: NextApiRequest) {
  return headers["user-agent"];
}
