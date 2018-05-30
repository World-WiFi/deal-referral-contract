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

    event createCampaign(uint campaignId);

    struct Campaign {
        address creator;
        uint tokenAmount;
        Status status;
    }

    address public owner;

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


    function Deal(address tokenAddress, address _owner) {
        owner = _owner;
        token = ERC223Interface(tokenAddress);
    }

    function safeSub(uint a, uint b) internal returns (uint) {
        assert(b <= a);
        return a - b;
    }

    function sum(uint[] array) public returns (uint) {
        uint summa;
        for (uint i; i < array.length; i++) {
            summa += array[i];
        }
        return summa;
    }

    function tokenFallback(address from, uint value, bytes data) returns (uint) {
       campaigns[campaignNum ++] = Campaign(from, value, Status.created);
       createCampaign(campaignNum);
    }

    function addTokensToCampaign(uint id, uint value) returns (bool success) {
        token.transferFrom(msg.sender, this, value);
        campaigns[id].tokenAmount += value;
    }

    function updateTokenAddress(address newAddr) onlyOwner {
        token = ERC223Interface(newAddr);
    }

    function destroyCampaign(uint id) onlyOwner returns (bool success) {
        token.transfer(campaigns[id].creator, campaigns[id].tokenAmount);
        campaigns[id].status = Status.destroyed;
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

    function sendCoin(address[] routerOwners, uint[] amount, uint id) onlyOwner {
        require(campaigns[id].status == Status.created);
        require(amount.length == routerOwners.length);
        require(sum(amount) <= campaigns[id].tokenAmount);

        for (var i = 0; i < amount.length; i++) {
           token.transfer(routerOwners[i], amount[i]); 
        }
        campaigns[id].status = Status.finished;
        var balance = safeSub(campaigns[id].tokenAmount, sum(amount));
        token.transfer(campaigns[id].creator, balance);
    }
}