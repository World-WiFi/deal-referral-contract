pragma solidity ^0.4.19;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract ERC223Interface {
    uint public totalSupply;
    function balanceOf(address who) constant returns (uint);
    function transfer(address to, uint value) public returns (bool success);
    function transfer(address to, uint value, bytes data) public returns (bool success);
    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}

contract SafeMath {
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

  function safeSub(uint a, uint b) internal returns (uint) {
    assert(b <= a);
    return a - b;
  }

  function safeAdd(uint a, uint b) internal returns (uint) {
    uint c = a + b;
    assert(c>=a && c>=b);
    return c;
  }

  function max64(uint64 a, uint64 b) internal constant returns (uint64) {
    return a >= b ? a : b;
  }

  function min64(uint64 a, uint64 b) internal constant returns (uint64) {
    return a < b ? a : b;
  }

  function max256(uint256 a, uint256 b) internal constant returns (uint256) {
    return a >= b ? a : b;
  }

  function min256(uint256 a, uint256 b) internal constant returns (uint256) {
    return a < b ? a : b;
  }

  function assert(bool assertion) internal {
    if (!assertion) {
      revert();
    }
  }
}

contract ReferralContract is Ownable, SafeMath {

  struct Ref {
    address walletReferral;
    address walletReferrer;
  }
  
  address public owner;
  ERC223Interface public we_token;
  Ref public ref;

  function ReferralContract(address tokenAddress, address referral, address referrer) {
    owner = msg.sender;
    we_token = ERC223Interface(tokenAddress);
    ref = Ref(referral, referrer);
  }

  function getReferral() public constant returns (address) {
    return ref.walletReferral;
  }

  function getReferrer() public constant returns (address) {
    return ref.walletReferrer;
  }

  function tokenFallback(address from, uint value, bytes data) {
     we_token.transfer(ref.walletReferrer, safeDiv(safeMul(value, 25), 100));
     we_token.transfer(ref.walletReferral, safeDiv(safeMul(value, 75), 100));
  }
}