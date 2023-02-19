import { createCOSEKey } from './createCOSEKey'
import { createCOSESign1Signature } from './createCOSESign1Signature'
import { createFakePrivateKey } from './createFakePrivateKey'
import { createRewardAddress } from './createRewardAddress'

/**
 *
 * @param {String} host
 * @returns
 */
export const getAdminLoginDetails = (host: any) => {
  /**
   *
   * @param {CSL.RewardAddress} address
   * @param {CSL.PrivateKey} PrivateKey
   * @returns
   */
  const createLoginUserSignature = (address: any, privateKey: any) => {
    const payload = {
      host,
      action: 'Login',
      url: host + '/api/auth/callback/credentials',
      timestamp: Date.now()
    }
    return createCOSESign1Signature(payload, address, privateKey)
  }

  const adminPrivateKey = createFakePrivateKey(0)
  const adminStakeAddress = createRewardAddress(adminPrivateKey)

  return {
    key: Buffer.from(createCOSEKey(adminPrivateKey).to_bytes()).toString('hex'),
    signature: Buffer.from(
      createLoginUserSignature(adminStakeAddress, adminPrivateKey).to_bytes()
    ).toString('hex')
  }
}

module.exports = { getAdminLoginDetails }
