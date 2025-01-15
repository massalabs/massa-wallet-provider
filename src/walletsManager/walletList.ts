import { BearbyWallet } from '../bearbyWallet/BearbyWallet';
import { WalletInterfaces } from './types';
import { Wallet } from '../wallet/interface';
import { wait } from '../utils/time';
import { MassaStationWallet } from '../massaStation/MassaStationWallet';
import { WalletName } from '../wallet/types';
import { MetamaskWallet } from '../metamaskSnap/MetamaskWallet';

export const supportedWallets: WalletInterfaces = [
  BearbyWallet,
  MassaStationWallet,
  MetamaskWallet,
];

export async function getWallets(delay = 200): Promise<Wallet[]> {
  await wait(delay);

  // https://github.com/massalabs/wallet-provider/issues/281
  const wrapWithTimeout = async (
    promise: Promise<Wallet | null>,
    timeout: number,
  ): Promise<Wallet | null> => {
    return Promise.race([
      promise,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout),
      ),
    ]).catch(() => {
      return null;
    });
  };

  const walletPromises = supportedWallets.map((WalletClass) =>
    wrapWithTimeout(WalletClass.createIfInstalled(), 100),
  );

  const resolvedWallets = await Promise.all(walletPromises);
  return resolvedWallets.filter((wallet) => wallet !== null);
}

export async function getWallet(
  name: WalletName,
  delay = 200,
): Promise<Wallet | undefined> {
  const wallets = await getWallets(delay);
  return wallets.find((p) => p.name() === name);
}
