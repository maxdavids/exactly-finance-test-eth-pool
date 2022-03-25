pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ETHPool: Deposit ETH and receive weekly rewards.
 *
 * @notice A contract which provides a service where people can deposit ETH and receive weekly rewards.
 *   Users are able to take out their deposits along with their portion of the rewards at any time.
 *   New rewards are deposited into the pool by the ETHPool's team each week.
 *
 *   - Only the team can deposit rewards.
 *   - Deposited rewards go to the pool of users, not to individual users.
 *   - Users can withdraw their deposits along with their share of rewards at any time.
 */

contract ETHPoolV1 is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 constant internal MAGNITUDE = 2 ** 64;

    mapping(address => uint256) internal _accountsBalance;
    mapping(address => int256) internal _payoutsTo;

    uint256 internal _totalAccountsBalance;
    uint256 internal _rewardsPerShare;

    event DepositedRewards(address indexed callerAddress, uint256 amountETH);
    event DepositedETH(address indexed clientAddress, uint256 amountETH);
    event WithdrewTotalAccountBalance(address indexed clientAddress, uint256 ethToWithdraw);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    receive() external payable virtual {
        depositETH();
    }

    fallback() external payable virtual {
        
    }

    // ================
    // PUBLIC FUNCTIONS
    // ================

    function initialize() initializer public {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Deposit ETH rewards to the rewards pool.
    function depositRewards()
        public
        payable
        virtual
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        address callerAddress = _msgSender();
        uint256 amountETH = msg.value;

        require(amountETH > 0, "ETH amount must be > 0");
        require(_totalAccountsBalance > 0, "There is no account balance");

        _rewardsPerShare += (amountETH * MAGNITUDE) / _totalAccountsBalance;

        // Fire event
        emit DepositedRewards(callerAddress, amountETH);
    }

    /// @notice Deposit ETH to earn weekly rewards.
    function depositETH()
        public
        payable
        virtual
        whenNotPaused
    {
        address clientAddress = _msgSender();
        uint256 incomingETH = msg.value;

        require(incomingETH > 0, "Amount to deposit should be > 0");

        if(_totalAccountsBalance > 0){
            _totalAccountsBalance += incomingETH;
        } else {
            _totalAccountsBalance = incomingETH;
        }

        _accountsBalance[clientAddress] += incomingETH;

        // Clients cannot claim rewards they do not own
        _payoutsTo[clientAddress] += (int256) (_rewardsPerShare * incomingETH);

        // Fire event
        emit DepositedETH(clientAddress, incomingETH);
    }

    /// @notice Transfers to the sender their deposited ETH plus their unclaimed rewards.
    /// @dev Could be split into: withdrawTotalAccountBalance, withdrawAccountBalance, and withdrawAccountRewards.
    function withdrawTotalAccountBalance()
        public
        virtual
        whenNotPaused
    {
        address clientAddress = _msgSender();

        uint256 balanceToWithdraw = balanceOf(clientAddress);
        uint256 rewardsToWithdraw = rewardsOf(clientAddress);

        // withdrawAccountRewards
        _payoutsTo[clientAddress] += (int256) (rewardsToWithdraw * MAGNITUDE);

        // withdrawAccountBalance
        _totalAccountsBalance -= balanceToWithdraw;
        _accountsBalance[clientAddress] -= balanceToWithdraw;

        int256 _transactionPayouts = (int256) (_rewardsPerShare * balanceToWithdraw + (balanceToWithdraw * MAGNITUDE));
        _payoutsTo[clientAddress] -= _transactionPayouts;

        // Transfer the total balance
        uint256 totalETHToWithdraw = balanceToWithdraw + rewardsToWithdraw;

        (bool sent,) = payable(clientAddress).call{value: totalETHToWithdraw}("");
        require(sent, "Failed to send ETH");

        // Fire event
        emit WithdrewTotalAccountBalance(clientAddress, totalETHToWithdraw);
    }

    // ================
    // GETTER FUNCTIONS
    // ================

    function totalAccountsBalance() public view virtual returns(uint256) {
        return _totalAccountsBalance;
    }

    function balanceOf(address clientAddress) public view virtual returns(uint256) {
        return _accountsBalance[clientAddress];
    }

    function rewardsOf(address clientAddress) public view virtual returns(uint256) {
        uint256 totalRewards = _rewardsPerShare * _accountsBalance[clientAddress];
        int256 totalPayouts = _payoutsTo[clientAddress];
        int256 claimableRewards = (int256(totalRewards) - totalPayouts) / int256(MAGNITUDE);

        return uint256(claimableRewards);
    }

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    // ==================
    // INTERNAL FUNCTIONS
    // ==================

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        virtual
        override
    {}
}
