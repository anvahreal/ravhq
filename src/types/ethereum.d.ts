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
