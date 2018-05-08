const Deal = artifacts.require('./Deal.sol')
const WTToken = artifacts.require('./WTToken')

var accounts = web3.eth.accounts;

contract('Deal', function ([owner, investor]) {
    let wttoken
	let deal

	beforeEach('setup contract for each test', async function () {
        wttoken = await WTToken.new(owner)
		deal = await Deal.new(wttoken.address)
	})

	it('has an owner', async function () {
        assert.equal(await deal.owner(), owner)
    })

    it ('has wttoken address in deal', async function() {
        assert.equal(await deal.token(), wttoken.address)
    })

    it ('update wttoken address in deal', async function(){
        newToken = await WTToken.new(owner)
        await deal.updateTokenAddress(newToken.address)
        assert.equal(await deal.token(), newToken.address)
    })

    it ('transfer tokens to investor', async function() {
        await wttoken.transfer(investor, 1000)
        assert.equal(await wttoken.balanceOf(investor), 1000)
    })

    it ('creates campaign', async function() {
        dealIntsance = deal.createCampaign(investor, [accounts[0], accounts[1], accounts[2]])
        //assert.equal(deal.getCampaignById(0), [accounts[0], accounts[1], accounts[2]])
        console.log(await deal.getCampaignById(0))
    })
})