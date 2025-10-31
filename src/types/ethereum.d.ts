import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
    };
  }
}

export {};

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    isMetaMask?: boolean;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
  };
}
