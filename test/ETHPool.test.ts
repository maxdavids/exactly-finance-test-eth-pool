import { ethers, upgrades } from 'hardhat';
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BaseProvider } from '@ethersproject/providers';

describe("ETHPoolV1 contract", function () {
    let poolFactoryV1: ContractFactory;
    let poolMockFactoryV2: ContractFactory;
    let poolContract: Contract;
    let provider: BaseProvider;
    let deployer: SignerWithAddress;
    let alice: SignerWithAddress;
    let john: SignerWithAddress;
    let mike: SignerWithAddress;
    let addrs: SignerWithAddress[];

    before(async () => {
        [deployer, alice, john, mike, ...addrs] = await ethers.getSigners();
        provider = ethers.getDefaultProvider();
        poolFactoryV1 = await ethers.getContractFactory('ETHPoolV1');
    });

    beforeEach(async () => {
        poolContract = await upgrades.deployProxy(poolFactoryV1, { kind: 'uups' });
    });

    describe("Client account management", () => {
        it("Should increase Alice's balance", async () => {
            const addAmount: BigNumber = ethers.utils.parseEther("1.0");

            const balanceBefore: any = await poolContract.balanceOf(alice.address);
            await alice.sendTransaction({ to: poolContract.address, value: addAmount });
            const balanceAfter: any = await poolContract.balanceOf(alice.address);

            expect((balanceBefore.add(addAmount)).to.equal(balanceAfter));
        });

        it("Should withdraw Alice's balance", async () => {
            const aliceBalanceBefore: any = await provider.getBalance(alice.address);
            const accountBalanceBefore: any = await poolContract.balanceOf(alice.address);
            await poolContract.connect(alice).withdrawTotalAccountBalance();
            const aliceBalanceAfter: any = await provider.getBalance(alice.address);
            const accountBalanceAfter: any = await poolContract.balanceOf(alice.address);

            expect((aliceBalanceBefore.add(accountBalanceBefore)).to.equal(aliceBalanceAfter));
            expect(accountBalanceAfter.to.equal(0));
        });
    });

    /*
    describe("Reward distribution", () => {
        it("Should distribute rewards Alice", async () => {
            const addAmount: BigNumber = ethers.utils.parseEther("1.0");

            await alice.sendTransaction({ to: poolContract.address, value: addAmount });
            const balanceAfter: any = await poolContract.balanceOf(alice.address);

            expect((balanceBefore.add(addAmount)).to.equal(balanceAfter));
        });

        it("Should withdraw Alice's balance", async () => {
            const aliceBalanceBefore: any = await provider.getBalance(alice.address);
            const accountBalanceBefore: any = await poolContract.balanceOf(alice.address);
            await poolContract.connect(alice).withdrawTotalAccountBalance();
            const aliceBalanceAfter: any = await provider.getBalance(alice.address);
            const accountBalanceAfter: any = await poolContract.balanceOf(alice.address);

            expect((aliceBalanceBefore.add(accountBalanceBefore)).to.equal(aliceBalanceAfter));
            expect(accountBalanceAfter.to.equal(0));
        });
    });
    */

    /*
    Let say we have user A and B and team T.
    A deposits 100, and B deposits 300 for a total of 400 in the pool. Now A has 25% of the pool and B has 75%. When T deposits 200 rewards, A should be able to withdraw 150 and B 450.
    What if the following happens? A deposits then T deposits then B deposits then A withdraws and finally B withdraws. A should get their deposit + all the rewards. B should only get their deposit because rewards were sent to the pool before they participated.
    */

    describe("Upgrade", () => {
        beforeEach(async () => {
            poolMockFactoryV2 = await ethers.getContractFactory('MockETHPoolV2');
        });

        it("Should upgrade the contract", async () => {
            poolContract = await upgrades.upgradeProxy(poolContract, poolMockFactoryV2);

            expect(await poolContract.version()).to.equal('2.0.0');
        });
    });
});
