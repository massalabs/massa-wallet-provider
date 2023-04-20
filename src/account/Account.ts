import {
  IAccountBalanceRequest,
  IAccountBalanceResponse,
} from './AccountBalance';
import { IAccountSignRequest, IAccountSignResponse } from './AccountSign';
import { connector } from '../connector/Connector';
import { IAccountDetails } from './IAccountDetails';
import { AvailableCommands, ITransactionDetails } from '..';
import { IAccount } from './IAccount';
import { IAccountRollsRequest } from './IAccountRolls';
import { IAccountSendTransactionRequest } from './IAccountSendTransaction';

/**
 * This module contains the Account class. It is responsible for representing an account in the wallet.
 *
 * @remarks
 * This class provides methods to interact with the account's {@link balance} and to {@link sign} messages.
 *
 */
export class Account implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;

  /**
   * This constructor takes an object of type IAccountDetails and a providerName string as its arguments.
   *
   * @param address - The address of the account.
   * @param name - The name of the account.
   * @param providerName - The name of the provider.
   * @returns An instance of the Account class.
   *
   * @remarks
   * - The Account constructor takes an object of type IAccountDetails and a providerName string as its arguments.
   * - The IAccountDetails object contains the account's address and name.
   * - The providerName string identifies the provider that is used to interact with the blockchain.
   */
  public constructor({ address, name }: IAccountDetails, providerName: string) {
    this._address = address;
    this._name = name;
    this._providerName = providerName;
  }

  /**
   * @returns The address of the account.
   */
  public address(): string {
    return this._address;
  }

  /**
   * @returns The name of the account.
   */
  public name(): string {
    return this._name;
  }

  /**
   * @returns The name of the provider.
   */
  public providerName(): string {
    return this._providerName;
  }

  /**
   * This method aims to retrieve the account's balance.
   *
   * @returns A promise that resolves to an object of type IAccountBalanceResponse. It contains the account's balance.
   */
  public async balance(): Promise<IAccountBalanceResponse> {
    return new Promise<IAccountBalanceResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountBalance,
        { address: this._address } as IAccountBalanceRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccountBalanceResponse);
        },
      );
    });
  }

  /**
   * This method aims to sign a message.
   *
   * @param data - The message to be signed.
   * @returns An IAccountSignResponse object. It contains the signature of the message.
   */
  public async sign(data: Uint8Array): Promise<IAccountSignResponse> {
    return new Promise<IAccountSignResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountSign,
        { address: this._address, data } as IAccountSignRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccountSignResponse);
        },
      );
    });
  }

  /**
   * This method aims to buy rolls on behalf of the sender.
   *
   * @param amount - The amount of rolls to be purchased
   * @param fee - The fee to be paid for the transaction.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  buyRolls(amount: string, fee: string): Promise<ITransactionDetails> {
    return new Promise<ITransactionDetails>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountBuyRolls,
        { amount, fee } as IAccountRollsRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as ITransactionDetails);
        },
      );
    });
  }

  /**
   * This method aims to sell rolls on behalf of the sender.
   *
   * @param amount - The amount of rolls to be sold.
   * @param fee - The fee to be paid for the transaction.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  sellRolls(amount: string, fee: string): Promise<ITransactionDetails> {
    return new Promise<ITransactionDetails>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountSellRolls,
        { amount, fee } as IAccountRollsRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as ITransactionDetails);
        },
      );
    });
  }

  /**
   * This method aims to transfer MAS on behalf of the sender to a recipient.
   *
   * @param amount - The amount of MAS to be transferred.
   * @param fee - The fee to be paid for the transaction.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  sendTransaction(
    amount: string,
    recipientAddress: string,
    fee: string,
  ): Promise<ITransactionDetails> {
    return new Promise<ITransactionDetails>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountSendTransaction,
        { amount, recipientAddress, fee } as IAccountSendTransactionRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as ITransactionDetails);
        },
      );
    });
  }
}
