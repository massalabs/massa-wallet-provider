import { ITransactionDetails } from '..';
import { IAccountBalanceResponse } from './AccountBalance';
import { IAccountSignOutput } from './AccountSign';
import { Args, IContractReadOperationResponse } from '@massalabs/web3-utils';

/**
 * Defines the expected structure for an account.
 */
export interface IAccount {
  /** Retrieves the account's address. */
  address(): string;

  /** Retrieves the account's name. */
  name(): string;

  /** Retrieves the provider's name associated with the account. */
  providerName(): string;

  /** Initiates a balance retrieval request for the account. */
  balance(): Promise<IAccountBalanceResponse>;

  /**
   * Signs data.
   * @param data - Data to be signed (Buffer, Uint8Array, or string).
   */
  sign(data: Buffer | Uint8Array | string): Promise<IAccountSignOutput>;

  /**
   * Purchases rolls.
   * @param amount - Amount of rolls.
   * @param fee - Fee.
   */
  buyRolls(amount: bigint, fee: bigint): Promise<ITransactionDetails>;

  /**
   * Sells rolls.
   * @param amount - Amount of rolls.
   * @param fee - Fee.
   */
  sellRolls(amount: bigint, fee: bigint): Promise<ITransactionDetails>;

  /**
   * Sends a transaction.
   *
   * @param amount - Amount to send.
   * @param recipientAddress - Address of the recipient.
   * @param fee - Transaction fee.
   * @returns A promise resolving to an `ITransactionDetails` object.
   */
  sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails>;

  /**
   * Calls a smart contract.
   *
   * @param contractAddress - Address of the smart contract.
   * @param functionName - Name of the function to call.
   * @param parameter - Parameters to pass to the function.
   * @param amount - Amount of funds to send with the call.
   * @param fee - Fee for the transaction.
   * @param maxGas - Maximum gas to use for the transaction.
   * @param nonPersistentExecution - Optional flag for non-persistent execution.
   */
  callSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution?: boolean,
    description?: string,
  ): Promise<ITransactionDetails | IContractReadOperationResponse>;

  /**
   * Reads a smart contract.
   *
   * @param contractAddress - Address of the smart contract.
   * @param functionName - Name of the function to call.
   * @param parameters - Parameters to pass to the function.
   * @param amount - Amount of funds to send with the call.
   * @param fee - Fee for the transaction.
   * @param maxGas - Maximum gas to use for the transaction.
   */
  readSc(
    contractAddress: string,
    functionName: string,
    parameters: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
  ): Promise<IContractReadOperationResponse>;
}
