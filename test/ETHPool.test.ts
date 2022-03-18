import { ethers, upgrades } from 'hardhat';
import { expect } from "chai";
import { Contract, ContractFactory } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe("ETHPoolV1 contract", function () {
    let poolFactoryV1: ContractFactory;
    let poolTestFactoryV2: ContractFactory;
    let poolContract: Contract;
    let deployer: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    before(async () => {
        [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();
    });

    beforeEach(async () => {
        poolFactoryV1 = await ethers.getContractFactory('ETHPoolV1');
    });

    describe("Deployment", () => {
        it("Should deploy contract", async () => {
            poolContract = await upgrades.deployProxy(poolFactoryV1);
        });

        it("Should have the right owner", async () => {
            expect(await poolContract.owner()).to.equal(deployer.address);
        });
    });

    describe("Upgrade", () => {
        beforeEach(async () => {
            poolTestFactoryV2 = await ethers.getContractFactory('MockETHPoolV2');
        });

        it("Should upgrade the contract", async () => {
            poolContract = await upgrades.upgradeProxy(poolContract, poolTestFactoryV2);

            expect(await poolContract.version()).to.equal('2.0.0');
        });
    });
});
