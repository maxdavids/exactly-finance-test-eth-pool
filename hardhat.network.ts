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
    ropsten: {
        url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: { mnemonic: mnemonic }
    },
    rinkeby: {
        url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: { mnemonic: mnemonic }
    }
}

export default networks;
