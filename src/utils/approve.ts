import { PublicClient, WalletClient } from 'viem'

import { Asset } from '../model/asset'

import { fetchAllowance } from './allowance'
import { chain } from './chain'

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export async function approveMax(
  publicClient: PublicClient,
  walletClient: WalletClient,
  assets: Asset[],
  spenderAddress: `0x${string}`,
) {
  if (!walletClient || !walletClient.account) {
    throw new Error('Wallet client is not connected')
  }

  for (const asset of assets) {
    const allownace = await fetchAllowance(
      publicClient,
      asset.underlying,
      walletClient.account.address,
      spenderAddress,
    )
    if (allownace === 0n) {
      const hash = await walletClient.writeContract({
        address: asset.underlying.address,
        abi: _abi,
        functionName: 'approve',
        args: [spenderAddress, 2n ** 256n - 1n],
        account: walletClient.account,
        chain,
      })
      console.log(
        `Approving ${asset.underlying.symbol} for ${spenderAddress} with hash ${hash}`,
      )
    }
  }
}
