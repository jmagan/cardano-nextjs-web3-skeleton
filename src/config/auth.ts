import {Web3Authentication} from 'cardano-web3-utils';

const expirationTimeSpan = process.env.NODE_ENV === "development" ? Number.MAX_SAFE_INTEGER : Number(process.env.PAYLOAD_VALIDITY_IN_SECONDS!);

export const web3Auth =  new Web3Authentication(expirationTimeSpan, process.env.NEXT_PUBLIC_HOST!);
