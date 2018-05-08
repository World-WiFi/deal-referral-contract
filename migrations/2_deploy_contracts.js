const WTToken = artifacts.require("./WTToken.sol")

module.exports = function(deployer) {
	deployer.deploy(WTToken);
};