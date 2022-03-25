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
        provider = ethers.provider;
        poolFactoryV1 = await ethers.getContractFactory('ETHPoolV1');
    });

    beforeEach(async () => {
        poolContract = await upgrades.deployProxy(poolFactoryV1, { kind: 'uups' });
        await poolContract.deployed();
    });

    describe("Client account management", () => {
        it("Should increase A's balance", async () => {
            const addAmount: BigNumber = ethers.utils.parseEther("1.0");

            const balanceBefore: BigNumber = await poolContract.balanceOf(alice.address);
            await alice.sendTransaction({ to: poolContract.address, value: addAmount });
            const balanceAfter: BigNumber = await poolContract.balanceOf(alice.address);

            expect(balanceBefore.add(addAmount)).to.equal(balanceAfter);
        });

        it("Should withdraw A's balance", async () => {
            const addAmount: BigNumber = ethers.utils.parseEther("1.0");

            await alice.sendTransaction({ to: poolContract.address, value: addAmount });
            const aliceWithdrawal = await poolContract.connect(alice).withdrawTotalAccountBalance();

            await expect(aliceWithdrawal).to.changeEtherBalance(alice, addAmount);

            const accountBalanceAfter: BigNumber = await poolContract.balanceOf(alice.address);
            expect(accountBalanceAfter).to.equal(0);
        });
    });

    describe("Reward distribution", () => {
        it("Should distribute rewards to A", async () => {
            const aliceAddAmount: BigNumber = ethers.utils.parseEther("1.0");
            const teamAddRewards: BigNumber = ethers.utils.parseEther("1.0");

            await poolContract.connect(alice).depositETH({ value: aliceAddAmount });
            const aliceRewardsBefore: BigNumber = await poolContract.rewardsOf(alice.address);

            await poolContract.connect(deployer).depositRewards({ value: teamAddRewards });
            const aliceRewardsAfter: BigNumber = await poolContract.rewardsOf(alice.address);

            expect(aliceRewardsBefore.add(teamAddRewards)).to.equal(aliceRewardsAfter);
        });

        it("Should distribute rewards based on A deposits, T deposits, B deposits, T deposits", async () => {
            const aliceAddAmount: BigNumber = ethers.utils.parseEther("1.0");
            const johnAddAmount: BigNumber = ethers.utils.parseEther("1.0");
            const teamAddRewards1: BigNumber = ethers.utils.parseEther("1.0");
            const teamAddRewards2: BigNumber = ethers.utils.parseEther("1.0");

            const johnTotalRewards: BigNumber = ethers.utils.parseEther("0.5");
            const aliceTotalRewards: BigNumber = ethers.utils.parseEther("1.5");

            await poolContract.connect(alice).depositETH({ value: aliceAddAmount });
            await poolContract.connect(deployer).depositRewards({ value: teamAddRewards1 });

            expect(await poolContract.rewardsOf(alice.address)).to.equal(teamAddRewards1);

            await poolContract.connect(john).depositETH({ value: johnAddAmount });
            const johnRewardsBefore: BigNumber = await poolContract.rewardsOf(john.address);

            await poolContract.connect(deployer).depositRewards({ value: teamAddRewards2 });
            const johnRewardsAfter: BigNumber = await poolContract.rewardsOf(john.address);

            expect(johnRewardsBefore.add(johnTotalRewards)).to.equal(johnRewardsAfter);
            expect(await poolContract.rewardsOf(alice.address)).to.equal(aliceTotalRewards);

            const aliceWithdrawal = await poolContract.connect(alice).withdrawTotalAccountBalance();
            await expect(aliceWithdrawal).to.changeEtherBalance(alice, aliceAddAmount.add(aliceTotalRewards));
        });
    });

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
