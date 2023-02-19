import CSL from '@emurgo/cardano-serialization-lib-nodejs'

/**
 *
 * @param {CSL.PrivateKey} privateKey
 * @param {CSL.NetworkId} networkId
 * @returns
 */
export const createRewardAddress = (
  privateKey: any,
  networkId = CSL.NetworkId.mainnet()
) => {
  return CSL.RewardAddress.new(
    networkId.kind(),
    CSL.StakeCredential.from_keyhash(privateKey.to_public().hash())
  )
}
