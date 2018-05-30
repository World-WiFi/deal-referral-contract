pragma solidity ^0.4.19;

contract ERC223Interface {
    uint public totalSupply;
    function balanceOf(address who) constant returns (uint);
    function transfer(address to, uint value) public returns (bool success);
    function transfer(address to, uint value, bytes data) public returns (bool success);
    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}

contract ReferralContract {

  address public referral;
  address public referrer;
  ERC223Interface public we_token;

  function ReferralContract(address tokenAddress, address referralAddr, address referrerAddr) {
    we_token = ERC223Interface(tokenAddress);
    referral = referralAddr;
    referrer = referrerAddr;
  }

  function safeMul(uint a, uint b) internal returns (uint) {
    uint c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function safeDiv(uint a, uint b) internal returns (uint) {
    assert(b > 0);
    uint c = a / b;
    assert(a == b * c + a % b);
    return c;
  }

  function tokenFallback(address from, uint value, bytes data) {
     we_token.transfer(referrer, safeDiv(safeMul(value, 25), 100));
     we_token.transfer(referral, safeDiv(safeMul(value, 75), 100));
  }
}