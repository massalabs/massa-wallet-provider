import {
  Args,
  IContractReadOperationData,
  IContractReadOperationResponse,
} from '@massalabs/web3-utils';
import { IProvider, ITransactionDetails } from '..';
import {
  IAccountBalanceResponse,
  IAccountDetails,
  IAccountSignResponse,
} from '../account';
import { IAccount } from '../account/IAccount';
import { CallParam, web3 } from '@hicaru/bearby.js';
import {
  postRequest,
  JsonRpcResponseData,
} from '../massaStation/RequestHandler';
import { BalanceResponse } from './BalanceResponse';
import { NodeStatus } from './NodeStatus';
import { JSON_RPC_REQUEST_METHOD } from './jsonRpcMethods';
import axios, { AxiosRequestHeaders, AxiosResponse } from 'axios';
import { BearbyProvider } from './BearbyProvider';
import { base58Decode } from './Xbqcrypto';

/**
 * The maximum allowed gas for a read operation
 */
const MAX_READ_BLOCK_GAS = BigInt(4_294_967_295);

/**
 * Represents a signature.
 *
 * @see base58Encoded - The base58 encoded signature.
 */
export interface ISignature {
  base58Encoded: string;
}

/**
 * The RPC we are using to query the node
 */
export const PUBLIC_NODE_RPC = 'https://buildnet.massa.net/api/v2';

export enum OperationsType {
  Payment,
  RollBuy,
  RollSell,
  ExecuteSC,
  CallSC,
}

/**
 * Associates an operation type with a number.
 */
export enum OperationTypeId {
  Transaction = 0,
  RollBuy = 1,
  RollSell = 2,
  ExecuteSC = 3,
  CallSC = 4,
}

export const requestHeaders = {
  Accept:
    'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
} as AxiosRequestHeaders;

export class BearbyAccount implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;
  private _nodeUrl = PUBLIC_NODE_RPC;

  public constructor({ address, name }: IAccountDetails, providerName: string) {
    this._address = address;
    this._name = name ?? 'Bearby_account';
    this._providerName = providerName;
  }

  public address(): string {
    return this._address;
  }

  public name(): string {
    return this._name;
  }

  public providerName(): string {
    return this._providerName;
  }

  public async connect() {
    try {
      await web3.wallet.connect();
    } catch (ex) {
      console.log('Bearby connection: ', ex);
    }
  }

  // needs testing
  public async balance(): Promise<IAccountBalanceResponse> {
    await this.connect();
    // Not available on bearby. we have to manually call the api
    const body = {
      jsonrpc: '2.0',
      method: 'get_addresses',
      params: [[this._address]],
      id: 0,
    };
    const addressInfos = await postRequest<BalanceResponse>(
      PUBLIC_NODE_RPC,
      body,
    );
    if (addressInfos.isError || addressInfos.error) {
      throw addressInfos.error.message;
    }
    return {
      finalBalance: addressInfos.result.result[0].final_balance,
      candidateBalance: addressInfos.result.result[0].candidate_balance,
    } as IAccountBalanceResponse;
  }

  // need testing
  public async sign(data: Uint8Array | string): Promise<IAccountSignResponse> {
    await this.connect();
    const encoder = new TextEncoder();
    if (typeof data === 'string') {
      const signature = await web3.wallet.signMessage(data);
      return {
        publicKey: signature.publicKey,
        signature: encoder.encode(signature.signature),
      } as IAccountSignResponse;
    }
    const strData = new TextDecoder().decode(data);
    return {
      publicKey: (await web3.wallet.signMessage(strData)).publicKey,
      signature: encoder.encode(
        (await web3.wallet.signMessage(strData)).signature,
      ),
    } as IAccountSignResponse;
  }

  // need testing
  public async buyRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    await this.connect();
    const signedTx = await web3.wallet.signTransaction({
      type: OperationsType.RollBuy,
      amount: amount.toString(),
      fee: fee.toString(),
      payload: '', // TODO: check how do we have to set it
    });

    // broadcast the transaction
    const provider = ''; // TODO: GET THE PROVIDER FROM BEARBY (if possible ..)

    throw new Error('Method not implemented.');
  }

  // need testing
  public async sellRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    await this.connect();
    const signedTx = await web3.wallet.signTransaction({
      type: OperationsType.RollSell,
      amount: amount.toString(),
      fee: fee.toString(),
      payload: '', // TODO: check how do we have to set it
    });

    // broadcast the transaction
    const provider = ''; // TODO: GET THE PROVIDER FROM BEARBY

    throw new Error('Method not implemented.');
  }

  public async sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    await this.connect();
    const signedTx = await web3.wallet.signTransaction({
      type: OperationsType.Payment,
      amount: amount.toString(),
      recipient: recipientAddress,
      fee: fee.toString(),
      payload: '', // TODO: check how do we have to set it
    });

    return {
      operationId: '00',
    } as ITransactionDetails;
  }

  public async callSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution = false,
  ) {
    await this.connect();
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

    if (parameter instanceof Uint8Array) {
      throw new Error(
        'Protobuf serialization is not supported by bearby wallet. To use it switch to MassaStation',
      );
    }
    // setup the params from Args
    let params: CallParam[] = [];
    try {
      params = parameter.getArgsList().map((arg) => {
        return {
          type: arg.type,
          value: arg.value,
        } as CallParam;
      });
    } catch (ex) {
      throw new Error(
<<<<<<< HEAD
        /* eslint-disable-next-line max-len */
        'Bearby wallet does not support Uint8Array, serializable and serializableObjectArray. To use them switch to MassaStation',
=======
        `Bearby wallet does not support Uint8Array, serializable and serializableObjectArray. 
To use them switch to MassaStation`,
>>>>>>> 4469cdc (fix bearby provider)
      );
    }

    return await web3.contract.call({
      maxGas: Number(maxGas),
      coins: Number(amount),
      fee: Number(fee),
      targetAddress: contractAddress,
      functionName: functionName,
      parameters: params,
    });

    // // convert parameter to an array of numbers
    // let argumentArray: Array<number> = [];
    // if (parameter instanceof Uint8Array) {
    //   argumentArray = Array.from(parameter);
    // } else {
    //   argumentArray = Array.from(parameter.serialize());
    // }

    // const callData = {
    //   fee: fee,
    //   maxGas: maxGas,
    //   coins: amount,
    //   targetAddress: contractAddress,
    //   functionName: functionName,
    //   parameter: argumentArray,
    // } as ICallData;

    // // get next period info to set the expiry period
    // const nodeStatusInfo: NodeStatus = await this.getNodeStatus();
    // // 5 is the default value used in massa-web3 for expiry period
    // const expiryPeriod: number = nodeStatusInfo.next_slot.period + 5;
    // // bytes compaction
    // const bytesCompact: Buffer = compactBytesForOperation(
    //   callData,
    //   OperationTypeId.CallSC,
    //   expiryPeriod,
    // );

    // // We need the public key but bearby doesn't allow us to get it directly.
    // // We have to sign a message and get the public key from the signature
    // const pubKey = (await this.sign('nothing')).publicKey;
    // // sign payload
    // const bytesPublicKey: Uint8Array = getBytesPublicKey(pubKey);
    // // get the signature and encode it to base58
    // const signatureUInt8Array = (
    //   await this.sign(Buffer.concat([bytesPublicKey, bytesCompact]))
    // ).signature;
    // const signature = base58Encode(signatureUInt8Array);
    // // request data
    // const data = {
    //   serialized_content: Array.prototype.slice.call(bytesCompact),
    //   creator_public_key: pubKey,
    //   signature: signature,
    // };

    // // returns operation ids
    // let opIds: Array<string> = [];
    // const jsonRpcRequestMethod = JSON_RPC_REQUEST_METHOD.SEND_OPERATIONS;
    // opIds = await this.sendJsonRPCRequest(jsonRpcRequestMethod, [[data]]);
    // if (opIds.length <= 0) {
    //   throw new Error(
    //     `Call smart contract operation bad response. No results array in json rpc response. Inspect smart contract`,
    //   );
    // }
    // return opIds[0];
  }

  /**
   * Retrieves the node's status.
   *
   * @remarks
   * The returned information includes:
   * - Whether the node is reachable
   * - The number of connected peers
   * - The node's version
   * - The node's configuration parameters
   *
   * @returns A promise that resolves to the node's status information.
   */
  public async getNodeStatus(): Promise<NodeStatus> {
    const jsonRpcRequestMethod = JSON_RPC_REQUEST_METHOD.GET_STATUS;
    return await this.sendJsonRPCRequest<NodeStatus>(jsonRpcRequestMethod, []);
  }

  /**
   * Sends a post JSON rpc request to the node.
   *
   * @param resource - The rpc method to call.
   * @param params - The parameters to pass to the rpc method.
   *
   * @throws An error if the rpc method returns an error.
   *
   * @returns A promise that resolves as the result of the rpc method.
   */
  protected async sendJsonRPCRequest<T>(
    resource: JSON_RPC_REQUEST_METHOD,
    params: object,
  ): Promise<T> {
    let resp: JsonRpcResponseData<T> = null;
    resp = await this.promisifyJsonRpcCall(resource, params);

    // in case of rpc error, rethrow the error.
    if (resp.isError || resp.error) {
      throw resp.error;
    }

    return resp.result;
  }

  /**
   * Converts a json rpc call to a promise that resolves as a JsonRpcResponseData
   *
   * @privateRemarks
   * If there is an error while sending the request, the function catches the error, the isError
   * property is set to true, the result property set to null, and the error property set to a
   * new Error object with a message indicating that there was an error.
   *
   * @param resource - The rpc method to call.
   * @param params - The parameters to pass to the rpc method.
   *
   * @returns A promise that resolves as a JsonRpcResponseData.
   */
  private async promisifyJsonRpcCall<T>(
    resource: JSON_RPC_REQUEST_METHOD,
    params: object,
  ): Promise<JsonRpcResponseData<T>> {
    let resp: AxiosResponse<JsonRpcResponseData<T>> = null;

    const body = {
      jsonrpc: '2.0',
      method: resource,
      params: params,
      id: 0,
    };

    try {
      resp = await axios.post(this._nodeUrl, body, requestHeaders);
    } catch (ex) {
      return {
        isError: true,
        result: null,
        error: new Error('JSON.parse error: ' + String(ex)),
      } as JsonRpcResponseData<T>;
    }

    const responseData: JsonRpcResponseData<T> = resp.data;

    if (responseData.error) {
      return {
        isError: true,
        result: null,
        error: new Error(responseData.error.message),
      } as JsonRpcResponseData<T>;
    }

    return {
      isError: false,
      result: responseData.result as T,
      error: null,
    } as JsonRpcResponseData<T>;
  }

  /**
   * Find provider for a concrete rpc method
   *
   * @remarks
   * This method chooses the provider to use for a given rpc method.
   *  - If the rpc method is about getting or sending data to the blockchain,
   *    it will choose a public provider.
   *  - If the rpc method is meant to be used by the node itself, it will choose a private provider.
   *  - An error is thrown if no provider is found for the rpc method.
   *
   * @param requestMethod - The rpc method to find the provider for.
   *
   * @returns The provider for the rpc method.
   */
  private getProviderForRpcMethod(
    requestMethod: JSON_RPC_REQUEST_METHOD,
  ): IProvider {
    switch (requestMethod) {
      case JSON_RPC_REQUEST_METHOD.GET_ADDRESSES:
      case JSON_RPC_REQUEST_METHOD.GET_STATUS:
      case JSON_RPC_REQUEST_METHOD.SEND_OPERATIONS:
      case JSON_RPC_REQUEST_METHOD.GET_OPERATIONS:
      case JSON_RPC_REQUEST_METHOD.GET_BLOCKS:
      case JSON_RPC_REQUEST_METHOD.GET_ENDORSEMENTS:
      case JSON_RPC_REQUEST_METHOD.GET_CLIQUES:
      case JSON_RPC_REQUEST_METHOD.GET_STAKERS:
      case JSON_RPC_REQUEST_METHOD.GET_FILTERED_SC_OUTPUT_EVENT:
      case JSON_RPC_REQUEST_METHOD.EXECUTE_READ_ONLY_BYTECODE:
      case JSON_RPC_REQUEST_METHOD.EXECUTE_READ_ONLY_CALL:
      case JSON_RPC_REQUEST_METHOD.GET_DATASTORE_ENTRIES:
      case JSON_RPC_REQUEST_METHOD.GET_BLOCKCLIQUE_BLOCK_BY_SLOT:
      case JSON_RPC_REQUEST_METHOD.GET_GRAPH_INTERVAL: {
        return new BearbyProvider('Bearby');
      }
      case JSON_RPC_REQUEST_METHOD.STOP_NODE:
      case JSON_RPC_REQUEST_METHOD.NODE_BAN_BY_ID:
      case JSON_RPC_REQUEST_METHOD.NODE_BAN_BY_IP:
      case JSON_RPC_REQUEST_METHOD.NODE_UNBAN_BY_ID:
      case JSON_RPC_REQUEST_METHOD.NODE_UNBAN_BY_IP:
      case JSON_RPC_REQUEST_METHOD.GET_STAKING_ADDRESSES:
      case JSON_RPC_REQUEST_METHOD.REMOVE_STAKING_ADDRESSES:
      case JSON_RPC_REQUEST_METHOD.ADD_STAKING_PRIVATE_KEYS:
      case JSON_RPC_REQUEST_METHOD.NODE_SIGN_MESSAGE:
      case JSON_RPC_REQUEST_METHOD.NODE_REMOVE_FROM_WHITELIST: {
        return new BearbyProvider('Bearby');
      }
      default:
        throw new Error(`Unknown Json rpc method: ${requestMethod}`);
    }
  }

  public async nonPersistentCallSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
  ): Promise<IContractReadOperationResponse> {
    // not clean but bearby doesn't allow us to get its node urls
    const node = PUBLIC_NODE_RPC;
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
      coins: Number(amount),
      fee: Number(fee),
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

const PUBLIC_KEY_PREFIX = 'P';

/**
 * Retrieves the byte representation of a given public key.
 *
 * @param publicKey - The public key to obtain the bytes from.
 *
 * @throws If the public key has an incorrect {@link PUBLIC_KEY_PREFIX}.
 *
 * @returns A Uint8Array containing the bytes of the public key.
 */
export function getBytesPublicKey(publicKey: string): Uint8Array {
  if (!(publicKey[0] == PUBLIC_KEY_PREFIX)) {
    throw new Error(
      `Invalid public key prefix: ${publicKey[0]} should be ${PUBLIC_KEY_PREFIX}`,
    );
  }
  const publicKeyBase58Decoded: Buffer = base58Decode(
    publicKey.slice(1), // Slice off the prefix
  );
  return publicKeyBase58Decoded;
}
