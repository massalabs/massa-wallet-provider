import { INetworkName } from '../provider/IProvider';

export type ExecuteFunctionBody = {
  nickname: string;
  name: string;
  at: string;
  args?: string;
  fee?: string;
  maxGas?: string;
  coins?: number; // number type kept for backward compatibility
  async?: boolean;
  description?: string;
};

export type PluginInfo = {
  author: string;
  description: string;
  home: string;
  name: string;
  status: string;
  version: string;
};

export type PluginManagerBody = PluginInfo[];

export type getNetworkInfoBody = {
  chainId: number | string;
  network: INetworkName;
  url: string;
};
