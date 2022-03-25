import { ContractFactory } from 'ethers';
import { ethers, upgrades } from 'hardhat';

export async function deploy() {
    const contractName: string = 'ETHPoolV1';

    // ===========
    // DEPLOY POOL
    // ===========

    console.log(`Deploying ${contractName}`);

    const newPoolFactory: ContractFactory = await ethers.getContractFactory(contractName);
    const proxyContract = await upgrades.deployProxy(newPoolFactory, { kind: 'uups' });
    await proxyContract.deployed();

    console.log(`Deployed to ${proxyContract.address}`);
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
