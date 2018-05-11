pragma solidity ^0.4.19;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract ERC20Interface {
    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract Deal is Ownable {

    struct Campaign {
        address creator;
        address[] routers;
        uint tokenAmount;
        bool finished;
        bool destroyed;
    }

    address public owner;

    ERC20Interface public token;

    uint public campaignNum;

    mapping (uint => Campaign) public campaigns;

    modifier onlyCreator(uint campaignId) {
        require(msg.sender == campaigns[campaignId].creator);
        _;
    }


    function Deal(address tokenAddress) {
        owner = msg.sender;
        token = ERC20Interface(tokenAddress);
    }

    function sum(uint[] array) public returns (uint) {
        uint summa;
        for (uint i; i < array.length; i++) {
            summa += array[i];
        }
        return summa;
    }


    function updateTokenAddress(address newAddr) onlyOwner {
        token = ERC20Interface(newAddr);
    }

    function createCampaign(address[] _addresses, uint tokenAmount) returns (bool success) {
        require(token.balanceOf(msg.sender) >= tokenAmount);
        require(token.allowance(msg.sender, this) >= tokenAmount);
        campaigns[campaignNum ++] = Campaign(msg.sender, _addresses, tokenAmount, false, false);
        return true;    
    }

    function destroyCampaign(uint id) onlyCreator(id) returns (bool success) {
        campaigns[id].destroyed = true;
    }

    function getCampaignById(uint id) public constant returns (address[]) {
        return  campaigns[id].routers;
    }

    function checkFinished(uint id) public constant returns (bool finished) {
        return campaigns[id].finished;
    }

    function checkDestroyed(uint id) public constant returns (bool destroyed) {
        return campaigns[id].destroyed;
    }

    function getAddressCreatorById(uint id) public constant returns(address) {
        return campaigns[id].creator;
    }

    function sendCoin(uint[] amount, uint id) onlyOwner {
        require(!campaigns[id].finished && !campaigns[id].destroyed);
        require(amount.length == campaigns[id].routers.length);
        require(sum(amount) <= token.balanceOf(campaigns[id].creator));
        require(sum(amount) <= campaigns[id].tokenAmount);

        for (var i = 0; i < amount.length; i++) {
           token.transferFrom(campaigns[id].creator, campaigns[id].routers[i], amount[i]); 
        }
        campaigns[id].finished = true;
    }
}