/** Polyfills */
import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    bearby?: unknown;
    massaWallet?: {
      standalone: boolean;
    };
  }
}

// Check if we are on browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

export enum AvailableCommands {
  ProviderListAccounts = 'LIST_ACCOUNTS',
  ProviderDeleteAccount = 'DELETE_ACCOUNT',
  ProviderImportAccount = 'IMPORT_ACCOUNT',
  ProviderGetNodesUrls = 'GET_NODES_URLS',
  ProviderGetNetwork = 'GET_NETWORK',
  ProviderGetChainId = 'GET_CHAIN_ID',
  AccountBalance = 'ACCOUNT_BALANCE',
  AccountSign = 'ACCOUNT_SIGN',
  ProviderGenerateNewAccount = 'GENERATE_NEW_ACCOUNT',
  AccountSellRolls = 'ACCOUNT_SELL_ROLLS',
  AccountBuyRolls = 'ACCOUNT_BUY_ROLLS',
  AccountSendTransaction = 'ACCOUNT_SEND_TRANSACTION',
  AccountCallSC = 'ACCOUNT_CALL_SC',
}

export * from './errors';

export { MassaStationWallet } from './massaStation/MassaStationWallet';

export { MassaStationAccount } from './massaStation/MassaStationAccount';

export { getWallets, getWallet, WalletsListener } from './walletsManager';

export * from './wallet';

export {
  isMassaStationAvailable,
  isMassaWalletEnabled,
} from './massaStation/MassaStationDiscovery';
