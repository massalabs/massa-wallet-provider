import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from './RequestHandler';
import { MassaStationAccount } from './MassaStationAccount';
import { MassaStationAccountStatus, MSAccount, MSAccountsResp } from './types';
import { EventEmitter } from 'eventemitter3';
import { Wallet } from '../wallet/interface';
import { Network } from '@massalabs/massa-web3';
import { networkInfos } from './utils/network';
import { WalletName } from '../wallet';
import { isMassaWalletEnabled } from './MassaStationDiscovery';

/**
 * MassaStation url
 */
export const MASSA_STATION_URL = 'https://station.massa/';

/**
 * The MassaStation accounts url
 */
export const MASSA_STATION_ACCOUNTS_URL = `${MASSA_STATION_URL}plugin/massa-labs/massa-wallet/api/accounts`;

/**
 * Events emitted by MassaStation
 */
const MASSA_STATION_NETWORK_CHANGED = 'MASSA_STATION_NETWORK_CHANGED';

/**
 * This class provides an implementation for communicating with the MassaStation wallet.
 * @remarks
 * This class is used as a proxy to the MassaStation server for exchanging message over https calls.
 */
export class MassaStationWallet implements Wallet {
  private walletName = WalletName.MassaWallet;

  private eventsListener = new EventEmitter();
  private currentNetwork: Network;

  public name(): WalletName {
    return this.walletName;
  }

  static async createIfInstalled(): Promise<Wallet | null> {
    if (await isMassaWalletEnabled()) {
      return new MassaStationWallet();
    }
    return null;
  }

  public async accounts(): Promise<MassaStationAccount[]> {
    const res = await getRequest<MSAccountsResp>(MASSA_STATION_ACCOUNTS_URL);

    if (res.isError) {
      throw res.error;
    }
    return res.result
      .filter((account) => {
        return account.status === MassaStationAccountStatus.OK;
      })
      .map((account) => {
        return new MassaStationAccount(account.address, account.nickname);
      });
  }

  public async importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<void> {
    const res = await putRequest(MASSA_STATION_ACCOUNTS_URL, {
      publicKey,
      privateKey,
    });
    if (res.isError) {
      throw res.error;
    }
  }

  public async deleteAccount(address: string): Promise<void> {
    // get all accounts and find the account to delete
    const allAccounts = await getRequest<MSAccountsResp>(
      MASSA_STATION_ACCOUNTS_URL,
    );

    if (allAccounts.isError) throw allAccounts.error;

    const accountToDelete = allAccounts.result.find(
      (account) => account.address === address,
    );

    if (!accountToDelete) {
      throw new Error('Account not found');
    }

    const res = await deleteRequest<unknown>(
      `${MASSA_STATION_ACCOUNTS_URL}/${accountToDelete.nickname}`,
    );

    if (res.isError) {
      throw res.error;
    }
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async setRpcUrl(url: string): Promise<void> {
    throw new Error(
      'setRpcUrl is not yet implemented for the current provider.',
    );
  }

  /**
   * This method sends an http call to the MassaStation server to create a new random account.
   *
   * @returns a Promise that resolves to the details of the newly generated account.
   */
  public async generateNewAccount(name: string): Promise<MassaStationAccount> {
    const response = await postRequest<MSAccount>(
      MASSA_STATION_ACCOUNTS_URL + '/' + name,
      {},
    );

    if (response.isError) throw response.error;

    return new MassaStationAccount(
      response.result.address,
      response.result.nickname,
    );
  }

  public listenAccountChanges(): { unsubscribe: () => void } | undefined {
    throw new Error(
      'listenAccountChanges is not yet implemented for the current provider.',
    );
  }

  public listenNetworkChanges(
    callback: (network: Network) => void,
  ): { unsubscribe: () => void } | undefined {
    this.eventsListener.on(MASSA_STATION_NETWORK_CHANGED, (evt) =>
      callback(evt),
    );

    // check periodically if network changed
    const intervalId = setInterval(async () => {
      const network = await this.networkInfos();
      if (!this.currentNetwork) {
        this.currentNetwork = network;
        return;
      }
      if (this.currentNetwork.name !== network.name) {
        this.currentNetwork = network;
        this.eventsListener.emit(MASSA_STATION_NETWORK_CHANGED, network);
      }
    }, 500);

    return {
      unsubscribe: () => {
        clearInterval(intervalId);
        this.eventsListener.removeListener(
          MASSA_STATION_NETWORK_CHANGED,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {},
        );
      },
    };
  }

  /**
   * Simulates connecting to the station.
   * This method always returns `true` because the station is inherently connected.
   */
  public async connect(): Promise<boolean> {
    return true;
  }

  /**
   * Simulates disconnecting from the station.
   * This method always returns `true` because the station cannot be disconnected.
   */
  public async disconnect(): Promise<boolean> {
    return true;
  }

  /**
   * Indicates if the station is connected.
   * Always returns `true` because the station is always connected when running.
   */
  public async connected(): Promise<boolean> {
    return true;
  }

  /**
   * Indicates if the station is enabled.
   * Always returns `true` because the station is always enabled by default.
   */
  public enabled(): boolean {
    return true;
  }
}
