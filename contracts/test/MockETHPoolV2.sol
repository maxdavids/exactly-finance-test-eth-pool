// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../pool/ETHPoolV1.sol";

contract MockETHPoolV2 is ETHPoolV1 {

    function version() public pure virtual override returns (string memory) {
        return "2.0.0";
    }
}
