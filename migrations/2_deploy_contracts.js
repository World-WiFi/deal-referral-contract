const WTToken = artifacts.require("./WTToken.sol")
const Deal = artifacts.require("./Deal.sol")

module.exports = function(deployer, accounts) {
	deployer.deploy(WTToken, web3.eth.accounts[0]).then(function() {
		return deployer.deploy(Deal, WTToken.address);
	});
};