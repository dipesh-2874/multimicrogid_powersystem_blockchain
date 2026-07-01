// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EnergyToken is ERC20, Ownable {
    constructor(address _initialOwner) 
    ERC20("Energy Token", "ETK") 
    Ownable(_initialOwner)
    {}

    function mint(address to, uint256 amt) public onlyOwner{
        _mint(to, amt);
    }

    function burn(address from, uint256 amt) public onlyOwner{
        _burn(from, amt);
    }
    
}