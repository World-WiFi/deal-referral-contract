pragma solidity ^0.4.21;

contract ERC223Interface {
    uint public totalSupply;
    function balanceOf(address who) constant returns (uint);
    function transfer(address to, uint value) public returns (bool success);
    function transfer(address to, uint value, bytes data) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);
    event Transfer(address indexed from, address indexed to, uint value);
    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}

contract Deal {

    enum Status { created, destroyed, finished }

    event CreateCampaign(uint campaignId);
    event SendCoinForCampaign(uint campaignId);

    struct Campaign {
        address creator;
        uint tokenAmount;
        uint currentBalance;
        Status status;
    }

    address public owner;

    address public fee;

    ERC223Interface public token;

    uint public campaignNum;

    mapping (uint => Campaign) public campaigns;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyCreator(uint campaignId) {
        require(msg.sender == campaigns[campaignId].creator);
        _;
    }


    function Deal(address tokenAddress, address _owner, address _fee) {
        owner = _owner;
        fee = _fee;
        token = ERC223Interface(tokenAddress);
        campaignNum = 1;
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

    function safeSub(uint a, uint b) internal returns (uint) {
      assert(b <= a);
      return a - b;
    }

    function safeAdd(uint a, uint b) internal returns (uint) {
      uint c = a + b;
      assert(c>=a && c>=b);
      return c;
    }

    function sum(uint[] array) public returns (uint) {
        uint summa;
        for (uint i; i < array.length; i++) {
            summa += array[i];
        }
        return summa;
    }

    function changeFeeAddress(address newFee) onlyOwner {
        fee = newFee;
    }

    function tokenFallback(address from, uint value, bytes data) returns (uint) {
       campaigns[campaignNum ++] = Campaign(from, value, value, Status.created);
       CreateCampaign(campaignNum);
    }

    function addTokensToCampaign(uint id, uint value) onlyCreator(id) returns (bool success) {
        token.transferFrom(msg.sender, this, value);
        campaigns[id].tokenAmount += value;
        campaigns[id].currentBalance += value;
    }

    function updateTokenAddress(address newAddr) onlyOwner {
        token = ERC223Interface(newAddr);
    }

    function destroyCampaign(uint id) onlyOwner returns (bool success) {
        token.transfer(campaigns[id].creator, campaigns[id].tokenAmount);
        campaigns[id].status = Status.destroyed;
        campaigns[id].currentBalance = 0;
    }

    function checkStatus(uint id) public constant returns (Status status) {
        return campaigns[id].status;
    }

    function getAddressCreatorById(uint id) public constant returns(address) {
        return campaigns[id].creator;
    }

    function getTokenAmountForCampaign(uint id) public constant returns (uint value) {
        return campaigns[id].tokenAmount;
    }

    function getCurrentBalanceForCampaign(uint id) public constant returns (uint value) {
        return campaigns[id].currentBalance;
    }

    function finishCampaign(uint id) onlyOwner returns (bool success) {
        campaigns[id].status = Status.finished;
        token.transfer(campaigns[id].creator, campaigns[id].currentBalance);
        campaigns[id].currentBalance = 0;
    }

    function sendCoin(address[] _routerOwners, uint[] amount, uint id) onlyOwner {
        require(campaigns[id].status == Status.created);
        require(amount.length == _routerOwners.length);
        require(sum(amount) <= campaigns[id].tokenAmount);

        for (var i = 0; i < amount.length; i++) {
           token.transfer(_routerOwners[i], safeDiv(safeMul(amount[i], 95), 100)); 
        }
        token.transfer(fee, safeDiv(safeMul(sum(amount), 5), 100) );
        campaigns[id].currentBalance = safeSub(campaigns[id].currentBalance, sum(amount));
        SendCoinForCampaign(id);
    }
}