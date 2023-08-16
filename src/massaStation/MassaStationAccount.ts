import {
  IAccountBalanceResponse,
  IAccountDetails,
  IAccountSignResponse,
  ITransactionDetails,
} from '..';
import { IAccount } from '../account/IAccount';
import { JsonRpcResponseData, getRequest, postRequest } from './RequestHandler';
import {
  MASSA_STATION_URL,
  MASSA_STATION_ACCOUNTS_URL,
} from './MassaStationProvider';
import {
  Args,
  IContractReadOperationData,
  IContractReadOperationResponse,
} from '@massalabs/web3-utils';

import { argsToBase64, uint8ArrayToBase64 } from '../utils/argsToBase64';

/**
 * The maximum allowed gas for a read operation
 */
const MAX_READ_BLOCK_GAS = BigInt(4_294_967_295);

/**
 * This interface represents the payload returned by making a call to MassaStation's sign
 * operation `/signOperation` url.
 */
interface ISignOperation {
  operation: string;
  batch?: boolean;
  correlationId?: string;
}

/**
 * This interface represents the the individual wallet's final and pending balances returned by MassaStation
 */
interface IBalance {
  final: string;
  pending: string;
}

/**
 * This interface represents the payload returned by making a call to MassaStation's get balances url.
 */
interface IAddressesBalances {
  addressesAttributes: {
    [key: string]: { balance: IBalance };
  };
}

/**
 * This module contains the MassaStationAccount class. It is responsible for representing an account in
 * the MassaStation wallet.
 *
 * @remarks
 * This class provides methods to interact with MassaStation account's {@link balance} and to {@link sign} messages.
 *
 */
export class MassaStationAccount implements IAccount {
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
    let signOpResponse: JsonRpcResponseData<IAddressesBalances> = null;
    try {
      signOpResponse = await getRequest<IAddressesBalances>(
        `${MASSA_STATION_URL}massa/addresses?attributes=balance&addresses=${this._address}`,
      );
    } catch (ex) {
      console.error(`MassaStation account balance error`);
      throw ex;
    }
    if (signOpResponse.isError || signOpResponse.error) {
      throw signOpResponse.error;
    }
    const balance: IBalance =
      signOpResponse.result.addressesAttributes[this._address].balance;
    return {
      finalBalance: balance.final,
      candidateBalance: balance.pending,
    };
  }

  /**
   * This method aims to sign a message.
   *
   * @param data - The message to be signed.
   * @returns An IAccountSignResponse object. It contains the signature of the message.
   */
  public async sign(data: Buffer | Uint8Array | string): Promise<IAccountSignResponse> {
    if(data instanceof Buffer) {
      data = data.toString();
    }
    if(data instanceof Uint8Array) {
      data = new TextDecoder().decode(data);
    }
    let signOpResponse: JsonRpcResponseData<IAccountSignResponse> = null;
    try {
      signOpResponse = await postRequest<IAccountSignResponse>(
        `${MASSA_STATION_ACCOUNTS_URL}/${this._name}/sign`,
        {
          operation: data,
          batch: false,
        } as ISignOperation,
      );
    } catch (ex) {
      console.error(`MassaStation account signing error`);
      throw ex;
    }
    if (signOpResponse.isError || signOpResponse.error) {
      throw signOpResponse.error;
    }
    return signOpResponse.result;
  }

  /**
   * This method aims to buy rolls on behalf of the sender.
   *
   * @param amount - The amount of rolls to be bought.
   * @param fee - The fee to be paid for the transaction execution by the node.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  public async buyRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    let buyRollsOpResponse: JsonRpcResponseData<ITransactionDetails> = null;
    const url = `${MASSA_STATION_ACCOUNTS_URL}/${this._name}/rolls`;
    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      side: 'buy',
    };
    try {
      buyRollsOpResponse = await postRequest<ITransactionDetails>(url, body);
    } catch (ex) {
      console.error(`MassaStation account: error while buying rolls: ${ex}`);
      throw ex;
    }
    if (buyRollsOpResponse.isError || buyRollsOpResponse.error) {
      throw buyRollsOpResponse.error;
    }
    return buyRollsOpResponse.result;
  }

  /**
   * This method aims to sell rolls on behalf of the sender.
   *
   * @param amount - The amount of rolls to be sold.
   * @param fee - The fee to be paid for the transaction execution by the node.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  public async sellRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    let sellRollsOpResponse: JsonRpcResponseData<ITransactionDetails> = null;
    const url = `${MASSA_STATION_ACCOUNTS_URL}/${this._name}/rolls`;
    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      side: 'sell',
    };
    try {
      sellRollsOpResponse = await postRequest<ITransactionDetails>(url, body);
    } catch (ex) {
      console.error(`MassaStation account: error while selling rolls: ${ex}`);
      throw ex;
    }
    if (sellRollsOpResponse.isError || sellRollsOpResponse.error) {
      throw sellRollsOpResponse.error;
    }
    return sellRollsOpResponse.result;
  }

  /**
   * This method aims to transfer MAS on behalf of the sender to a recipient.
   *
   * @param amount - The amount of MAS (in the smallest unit) to be transferred.
   * @param fee - The fee to be paid for the transaction execution (in the smallest unit).
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  async sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    let sendTxOpResponse: JsonRpcResponseData<ITransactionDetails> = null;
    const url = `${MASSA_STATION_ACCOUNTS_URL}/${this._name}/transfer`;
    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      recipientAddress: recipientAddress,
    };
    try {
      sendTxOpResponse = await postRequest<ITransactionDetails>(url, body);
    } catch (ex) {
      console.error(
        `MassaStation account: error while sending transaction: ${ex}`,
      );
      throw ex;
    }
    if (sendTxOpResponse.isError || sendTxOpResponse.error) {
      throw sendTxOpResponse.error;
    }
    return sendTxOpResponse.result;
  }

  /**
   * This method aims to interact with a smart contract deployed on the MASSA blockchain.
   *
   * @remarks
   * If dryRun.dryRun is true, the method will dry run the smart contract call and return an
   * IContractReadOperationResponse object which contains all the information about the dry run
   * (state changes, gas used, etc.)
   *
   * @param contractAddress - The address of the smart contract.
   * @param functionName - The name of the function to be called.
   * @param parameter - The parameters as an Args object to be passed to the function.
   * @param amount - The amount of MASSA coins to be sent to the contract (in the smallest unit).
   * @param fee - The fee to be paid for the transaction execution (in the smallest unit).
   * @param maxGas - The maximum amount of gas to be used for the transaction execution.
   * @param nonPersistentExecution - The dryRun object to be passed to the function.
   *
   * @returns if 'nonPersistentExecution' is true, it returns an IContractReadOperationResponse object.
   * Otherwise, it returns an ITransactionDetails object which contains the operationId on the network.
   *
   */
  public async callSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution = false,
  ): Promise<ITransactionDetails | IContractReadOperationResponse> {
    if (nonPersistentExecution) {
      return this.nonPersistentCallSC(
        contractAddress,
        functionName,
        parameter,
        amount,
        fee,
        maxGas,
      );
    }
    // convert parameter to base64
    let args = '';
    if (parameter instanceof Uint8Array) {
      args = uint8ArrayToBase64(parameter);
    } else {
      args = argsToBase64(parameter);
    }
    let CallSCOpResponse: JsonRpcResponseData<ITransactionDetails> = null;
    const url = `${MASSA_STATION_URL}cmd/executeFunction`;
    const body = {
      nickname: this._name,
      name: functionName,
      at: contractAddress,
      args: args,
      coins: Number(amount),
    };
    try {
      CallSCOpResponse = await postRequest<ITransactionDetails>(url, body);
    } catch (ex) {
      console.log(
        `MassaStation account: error while interacting with smart contract: ${ex}`,
      );
      throw ex;
    }
    if (CallSCOpResponse.isError || CallSCOpResponse.error) {
      throw CallSCOpResponse.error;
    }
    return CallSCOpResponse.result;
  }

  public async getNodeUrlFromMassaStation(): Promise<string> {
    // get the node url from MassaStation
    let nodesResponse: JsonRpcResponseData<unknown> = null;
    let node = '';
    try {
      nodesResponse = await getRequest<unknown>(
        `${MASSA_STATION_URL}massa/node`,
      );
      if (nodesResponse.isError || nodesResponse.error) {
        throw nodesResponse.error.message;
      }
      // transform nodesResponse.result to a json and then get the "url" property
      const nodes = nodesResponse.result as { url: string };
      node = nodes.url;
    } catch (ex) {
      throw new Error(`MassaStation nodes retrieval error: ${ex}`);
    }
    return node;
  }

  public async nonPersistentCallSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
  ): Promise<IContractReadOperationResponse> {
    const node = await this.getNodeUrlFromMassaStation();
    // Gas amount check
    if (maxGas > MAX_READ_BLOCK_GAS) {
      throw new Error(
        `
        The gas submitted ${maxGas.toString()} exceeds the max. allowed block gas of 
        ${MAX_READ_BLOCK_GAS.toString()}
        `,
      );
    }

    // convert parameter to an array of numbers
    let argumentArray = [];
    if (parameter instanceof Uint8Array) {
      argumentArray = Array.from(parameter);
    } else {
      argumentArray = Array.from(parameter.serialize());
    }
    // setup the request body
    const data = {
      max_gas: Number(maxGas),
      target_address: contractAddress,
      target_function: functionName,
      parameter: argumentArray,
      caller_address: this._address,
    };
    const body = [
      {
        jsonrpc: '2.0',
        method: 'execute_read_only_call',
        params: [[data]],
        id: 0,
      },
    ];
    // returns operation ids
    let jsonRpcCallResult: Array<IContractReadOperationData> = [];
    try {
      let resp = await postRequest<Array<IContractReadOperationData>>(
        node,
        body,
      );
      if (resp.isError || resp.error) {
        throw resp.error.message;
      }
      jsonRpcCallResult = resp.result;
    } catch (ex) {
      throw new Error(
        `MassaStation account: error while interacting with smart contract: ${ex}`,
      );
    }
    if (jsonRpcCallResult.length <= 0) {
      throw new Error(
        `Read operation bad response. No results array in json rpc response. Inspect smart contract`,
      );
    }
    if (jsonRpcCallResult[0].result.Error) {
      throw new Error(jsonRpcCallResult[0].result.Error);
    }
    return {
      returnValue: new Uint8Array(jsonRpcCallResult[0].result[0].result.Ok),
      info: jsonRpcCallResult[0],
    };
  }
}
