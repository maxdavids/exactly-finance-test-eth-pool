import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { NetworksUserConfig } from "hardhat/types";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const networks: NetworksUserConfig = {
    localhost: {
        url: "http://127.0.0.1:8545"
    },
    hardhat: {
        allowUnlimitedContractSize: false,
    },
};

if (mnemonic) {
    networks.bsctestnet = {
        url: "https://data-seed-prebsc-1-s1.binance.org:8545",
        chainId: 97,
        gasPrice: 20000000000,
        accounts: { mnemonic: mnemonic }
    };
    networks.bscmainnet = {
        url: "https://bsc-dataseed.binance.org/",
        chainId: 56,
        gasPrice: 20000000000,
        accounts: { mnemonic: mnemonic }
    };
}

export default networks;
