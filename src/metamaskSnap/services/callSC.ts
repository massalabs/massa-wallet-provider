import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type CallSCParams = {
  fee: string;
  functionName: string;
  at: string;
  args: number[];
  coins: string;
  maxGas?: string;
};

export type CallSCResponse = {
  operationId: string;
};

/**
 * Function that calls the MetaMask provider to call a smart contract
 * @param provider - The MetaMask provider
 * @param params - The call smart contract parameters (see massa standard)
 * @returns The response of the operation
 */
export const callSC = async (
  provider: MetaMaskInpageProvider,
  params: CallSCParams,
): Promise<CallSCResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.callSC',
        params,
      },
    },
  }) as Promise<CallSCResponse>;
};
