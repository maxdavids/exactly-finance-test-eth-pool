import { ContractFactory } from 'ethers';
import { ethers, upgrades } from 'hardhat';

export async function deploy() {
    const contractName: string = 'ETHPoolV1';
    const newOwner: string = '';

    // -----------
    // DEPLOY POOL
    // -----------

    console.log(`Deploying ${contractName}`);

    const newPoolFactory: ContractFactory = await ethers.getContractFactory(contractName);
    const proxyContract = await upgrades.deployProxy(newPoolFactory);
    await proxyContract.deployed();

    console.log(`Deployed to ${proxyContract.address}`);


    // ----------------
    // CHANGE OWNERSHIP
    // ----------------

    console.log(`Transfering ownership to ${newOwner}`);

    await upgrades.admin.transferProxyAdminOwnership(newOwner);

    console.log(`Proxy ownership transfer complete`);
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
