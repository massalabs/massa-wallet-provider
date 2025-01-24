import { getRequest, postRequest } from './RequestHandler';
import { getMSWalletUrl, MASSA_STATION_URL } from './MassaStationWallet';
import {
  argsToBase64,
  base64ToByteArray,
  uint8ArrayToBase64,
} from '../utils/base64';
import {
  DeploySCFunctionBody,
  ExecuteFunctionBody,
  MSAccountSignPayload,
  MSAccountSignResp,
  MSBalancesResp,
  MSSendOperationResp,
} from './types';
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import {
  Address,
  CallSCParams,
  DatastoreEntry,
  DeploySCParams,
  EventFilter,
  formatNodeStatusObject,
  Mas,
  MAX_GAS_CALL,
  Network,
  NodeStatusInfo,
  Operation,
  OperationOptions,
  OperationStatus,
  Provider,
  ReadSCData,
  ReadSCParams,
  SignedData,
  SignOptions,
  SmartContract,
  strToBytes,
  rpcTypes,
  StorageCost,
  formatMas,
} from '@massalabs/massa-web3';
import { getClient, networkInfos } from './utils/network';
import { WalletName } from '../wallet';
import bs58check from 'bs58check';

/**
 * This module contains the MassaStationAccount class. It is responsible for representing an account in
 * the MassaStation wallet.
 *
 * @remarks
 * This class provides methods to interact with MassaStation account's {@link balance} and to {@link sign} messages.
 *
 */
export class MassaStationAccount implements Provider {
  private _providerName = WalletName.MassaWallet;

  constructor(
    public address: string,
    public accountName: string,
  ) {}

  get providerName(): string {
    return this._providerName;
  }

  public async balance(final = false): Promise<bigint> {
    const res = await getRequest<MSBalancesResp>(
      `${MASSA_STATION_URL}massa/addresses?attributes=balance&addresses=${this.address}`,
    );

    if (res.isError) throw res.error;

    const balances = res.result.addressesAttributes[this.address].balance;

    return Mas.fromString(final ? balances.final : balances.pending);
  }

  async balanceOf(
    addresses: string[],
    final = false,
  ): Promise<{ address: string; balance: bigint }[]> {
    const queryParams = new URLSearchParams();

    queryParams.append('attributes', 'balance');
    addresses.forEach((address) => {
      queryParams.append('addresses', address);
    });

    const res = await getRequest<MSBalancesResp>(
      `${MASSA_STATION_URL}massa/addresses?${queryParams.toString()}`,
    );

    if (res.isError) throw res.error;

    return addresses.map((address) => {
      const balance = res.result.addressesAttributes[address].balance;

      return {
        address,
        balance: Mas.fromString(final ? balance.final : balance.pending),
      };
    });
  }

  public async sign(
    data: Uint8Array | string,
    opts?: SignOptions,
  ): Promise<SignedData> {
    const signData: MSAccountSignPayload = {
      description: opts?.description ?? '',
      message: typeof data === 'string' ? data : new TextDecoder().decode(data),
      DisplayData: opts?.displayData ?? true,
    };

    const res = await postRequest<MSAccountSignResp>(
      `${getMSWalletUrl()}accounts/${this.accountName}/signMessage`,
      signData,
    );

    if (res.isError) {
      throw errorHandler(operationType.Sign, res.error);
    }

    // MS Wallet encodes signature in base64... so we need to decode it en re-encode it in base58
    const signature = bs58check.encode(
      await base64ToByteArray(res.result.signature),
    );

    return {
      publicKey: res.result.publicKey,
      signature,
    };
  }

  private async minimalFee(): Promise<bigint> {
    const client = await getClient();
    return client.getMinimalFee();
  }

  private async rollOperation(
    type: operationType.BuyRolls | operationType.SellRolls,
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    let fee = opts?.fee ?? (await this.minimalFee());

    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      side: type === operationType.BuyRolls ? 'buy' : 'sell',
    };

    const res = await postRequest<MSSendOperationResp>(
      `${getMSWalletUrl()}accounts/${this.accountName}/rolls`,
      body,
    );

    if (res.isError) {
      throw errorHandler(type, res.error);
    }
    return new Operation(this, res.result.operationId);
  }

  public async buyRolls(
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    return this.rollOperation(operationType.BuyRolls, amount, opts);
  }

  public async sellRolls(
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    return this.rollOperation(operationType.SellRolls, amount, opts);
  }

  async transfer(
    to: Address | string,
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    const fee = opts?.fee ?? (await this.minimalFee());

    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      recipientAddress: to.toString(),
    };

    const res = await postRequest<MSSendOperationResp>(
      `${getMSWalletUrl()}accounts/${this.accountName}/transfer`,
      body,
    );

    if (res.isError) {
      throw errorHandler(operationType.SendTransaction, res.error);
    }

    return new Operation(this, res.result.operationId);
  }

  public async callSC(params: CallSCParams): Promise<Operation> {
    // convert parameter to base64
    let args = '';
    if (params.parameter instanceof Uint8Array) {
      args = uint8ArrayToBase64(params.parameter);
    } else {
      args = argsToBase64(params.parameter);
    }

    let fee = params?.fee ?? (await this.minimalFee());

    const body: ExecuteFunctionBody = {
      nickname: this.accountName,
      name: params.func,
      at: params.target,
      args,
      coins: params.coins ? Number(params.coins) : 0,
      fee: fee.toString(),
      // If maxGas is not provided, estimation will be done by MS
      maxGas: params.maxGas ? params.maxGas.toString() : '',
      async: true,
    };

    const res = await postRequest<MSSendOperationResp>(
      `${MASSA_STATION_URL}cmd/executeFunction`,
      body,
    );

    if (res.isError) {
      throw errorHandler('callSmartContract', res.error);
    }
    return new Operation(this, res.result.operationId);
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  public async readSC(params: ReadSCParams): Promise<ReadSCData> {
    // Gas amount check
    if (params.maxGas > MAX_GAS_CALL) {
      throw new Error(
        `
        The gas submitted ${params.maxGas.toString()} exceeds the max. allowed block gas of 
        ${MAX_GAS_CALL.toString()}
        `,
      );
    }

    const client = await getClient();

    const fee = params?.fee ?? (await this.minimalFee());
    const caller = params.caller ?? this.address;
    const args = params.parameter ?? new Uint8Array();
    const readOnlyParams = {
      ...params,
      caller,
      fee,
      parameter:
        args instanceof Uint8Array ? args : Uint8Array.from(args.serialize()),
    };
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.executeReadOnlyCall(readOnlyParams);
  }

  public async deploySC(params: DeploySCParams): Promise<SmartContract> {
    try {
      const args = params.parameter ?? new Uint8Array();
      const parameters = args instanceof Uint8Array ? args : args.serialize();
      const coins = params.coins ?? 0n; // If coins is undefined, some vesions of station will have a panic
      const maxCoins =
        params.maxCoins ??
        StorageCost.smartContract(params.byteCode.length) + coins;
      const fee = params.fee || (await this.minimalFee());

      const body: DeploySCFunctionBody = {
        nickname: this.accountName,
        smartContract: uint8ArrayToBase64(params.byteCode),
        maxCoins: maxCoins.toString(), // SmartContract deployment costs
        coins: coins.toString(),
        fee: fee.toString(),
        parameters: uint8ArrayToBase64(parameters),
        description: `${formatMas(
          coins,
        )} $MAS coins allocated to datastore + ${formatMas(
          fee,
        )} $MAS fee for operation`,
      };

      const res = await postRequest<MSSendOperationResp>(
        `${MASSA_STATION_URL}cmd/deploySC`,
        body,
      );

      const operationId = res.result?.operationId;

      if (!operationId) throw new Error('Operation ID not found');

      const operation = new Operation(this, operationId);
      const deployedAddress = await operation.getDeployedAddress(
        params.waitFinalExecution,
      );

      return new SmartContract(this, deployedAddress);
    } catch (error) {
      throw new Error(`Error during smart contract deployment: ${error}`);
    }
  }

  executeSC(): Promise<Operation> {
    throw new Error('Method not implemented.');
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    const client = await getClient();
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.getOperationStatus(opId);
  }

  public async getEvents(filter: EventFilter): Promise<rpcTypes.OutputEvents> {
    const client = await getClient();
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.getEvents(filter);
  }

  public async getNodeStatus(): Promise<NodeStatusInfo> {
    const client = await getClient();
    const status = await client.status();
    return formatNodeStatusObject(status);
  }

  public async getStorageKeys(
    address: string,
    filter: Uint8Array | string = new Uint8Array(),
    final = true,
  ): Promise<Uint8Array[]> {
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    const client = await getClient();
    const filterBytes: Uint8Array =
      typeof filter === 'string' ? strToBytes(filter) : filter;
    return client.getDataStoreKeys(address, filterBytes, final);
  }

  public async readStorage(
    address: string,
    keys: Uint8Array[] | string[],
    final = true,
  ): Promise<Uint8Array[]> {
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    const client = await getClient();
    const entries: DatastoreEntry[] = keys.map((key) => ({
      key,
      address,
    }));
    return client.getDatastoreEntries(entries, final);
  }
}
