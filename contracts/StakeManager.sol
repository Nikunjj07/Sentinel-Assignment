// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract StakeManager {
    IERC20 public immutable token;
    address public immutable burner;

    mapping(address => uint256) public staked;

    event Staked(address indexed user, uint256 amount);
    event Burned(address indexed user, uint256 amount);
    event AddressTagged(address addr, string source);

    constructor(address _token, address _burner) {
        token = IERC20(_token);
        burner = _burner;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "amount = 0");
        token.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function burnFromStake(address user, uint256 amount) external {
        require(msg.sender == burner, "not authorized");
        require(staked[user] >= amount, "insufficient stake");

        staked[user] -= amount;

        // Proper burn
        ERC20Burnable(address(token)).burn(amount);

        emit Burned(user, amount);
        emit AddressTagged(user, "stake-burn");
    }
}
