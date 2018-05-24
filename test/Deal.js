const Deal = artifacts.require('./Deal.sol')
const WTToken = artifacts.require('./WTToken')
const ReferralContract = artifacts.require('./ReferralContract')

contract('Deal', function (accounts) {
    let wttoken
    let deal
    let ref1
    let ref2

    beforeEach('setup contract for each test', async function () {
        owner = accounts[0]
        investor1 = accounts[1]
        investor2 = accounts[2]
        routerOwner1 = accounts[3]
        routerOwner2 = accounts[4]
        routerOwner3 = accounts[5]
        routerOwner4 = accounts[6]
        routerOwner5 = accounts[7]
        newOwner = accounts[8]
        wwfAddress = accounts[9]
        wttoken = await WTToken.new(owner)
        deal = await Deal.new(wttoken.address)
        ref1 = await ReferralContract.new(wttoken.address, routerOwner2, routerOwner1)
        ref2 = await ReferralContract.new(wttoken.address, routerOwner3, ref1.address)
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

    it ('does not update wttoken address in deal because not owner', async function(){
        newToken = await WTToken.new(owner)
        try {
            await deal.updateTokenAddress(newToken.address, {from: investor1})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('transfer tokens to investor', async function() {
        await wttoken.transfer(investor1, 1000)
        assert.equal(await wttoken.balanceOf(investor1), 1000)
        await wttoken.transfer(ref2.address, 1000)
        console.log(await wttoken.balanceOf(routerOwner1))
        console.log(await wttoken.balanceOf(routerOwner2))
        console.log(await wttoken.balanceOf(routerOwner3))
    })

    it ('creates campaign', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(investor2, 2500)
        await wttoken.approve(deal.address, 1000, {from: investor1})
        await wttoken.approve(deal.address, 1500, {from: investor2})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        campaign = await deal.getCampaignById(0)
        assert.equal(campaign[0], routerOwner1)
        assert.equal(campaign[1], routerOwner2)
        assert.equal(await deal.checkFinished(0), false)

        await deal.createCampaign([routerOwner2, routerOwner3], 500, {from: investor2})
        campaign = await deal.getCampaignById(1)
        assert.equal(campaign[0], routerOwner2)
        assert.equal(campaign[1], routerOwner3)
        assert.equal(await deal.checkFinished(1), false) 

        await deal.createCampaign([routerOwner1, routerOwner2], 800, {from: investor2})
        campaign = await deal.getCampaignById(2)
        assert.equal(campaign[0], routerOwner1)
        assert.equal(campaign[1], routerOwner2) 
        assert.equal(await deal.checkFinished(2), false) 
    })

    it ('does not create campaign because not approved tokens', async function() {
        await wttoken.transfer(investor1, 1500)

        try {
          await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1}) 
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not create campaign because not enough tokens', async function() {
        await wttoken.approve(deal.address, 1000, {from: investor1})

        try {
          await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1}) 
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('finds campaign creator by compaign id', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(investor2, 2500)

        await wttoken.approve(deal.address, 1500, {from: investor1})
        await wttoken.approve(deal.address, 2500, {from: investor2})

        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        await deal.createCampaign([routerOwner3, routerOwner4], 1600, {from: investor2})

        assert.equal(await deal.getAddressCreatorById(0), investor1)
        assert.equal(await deal.getAddressCreatorById(1), investor2)

    })

    it ('sends coins to router owners', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(investor2, 2500)

        await wttoken.approve(deal.address, 1500, {from: investor1})
        await wttoken.approve(deal.address, 2500, {from: investor2})

        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        await deal.createCampaign([routerOwner3, routerOwner4], 1600, {from: investor2})
        await deal.createCampaign([routerOwner5], 400, {from: investor1})
        await deal.createCampaign([routerOwner5], 500, {from: investor2})

        await deal.sendCoin([300, 700], 0)
        await deal.sendCoin([1000, 600], 1)
        await deal.sendCoin([400], 2)
        await deal.sendCoin([500], 3)

        assert.equal(await wttoken.balanceOf(routerOwner1), 300)
        assert.equal(await wttoken.balanceOf(routerOwner2), 700)
        assert.equal(await wttoken.balanceOf(routerOwner3), 1000)
        assert.equal(await wttoken.balanceOf(routerOwner4), 600)
        assert.equal(await wttoken.balanceOf(routerOwner5), 900)

        assert.equal(await wttoken.balanceOf(investor1), 100)
        assert.equal(await wttoken.balanceOf(investor2), 400)

        assert.equal(await deal.checkFinished(0), true)
        assert.equal(await deal.checkFinished(1), true)
        assert.equal(await deal.checkFinished(2), true)
        assert.equal(await deal.checkFinished(3), true)   
    })

    it ('does not send coins to router owners because wrong number of tokens', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})

        try {
           await deal.sendCoin([300, 1700], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because campaign finished', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        await deal.sendCoin([300, 700], 0)

        try {
           await deal.sendCoin([200, 300], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because campaign destroyed', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        await deal.destroyCampaign(0, {from: investor1})

        try {
           await deal.sendCoin([200, 300], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because wrong quantity router owners', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        
        try {
           await deal.sendCoin([200], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because tokens are spent', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        await wttoken.transfer(investor2, 1000, {from: investor1})
        try {
           await deal.sendCoin([200, 1200], 0)
        } catch (error) {
            assert.equal(await wttoken.balanceOf(routerOwner1), 0)
            assert.equal(await wttoken.balanceOf(routerOwner2), 0)
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because sender not contract owner', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        try {
           await deal.sendCoin([200, 1200], 0, {from: investor1})
        } catch (error) {
            assert.equal(await wttoken.balanceOf(routerOwner1), 0)
            assert.equal(await wttoken.balanceOf(routerOwner2), 0)
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('destroys campaign', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})

        assert.equal(await deal.checkDestroyed(0), false)

        await deal.destroyCampaign(0, {from: investor1})

        assert.equal(await deal.checkDestroyed(0), true)

    })

    it ('does not destroy campaign when sender to equal creator', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.approve(deal.address, 1500, {from: investor1})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})

        assert.equal(await deal.checkDestroyed(0), false)
        
        try {
            await deal.destroyCampaign(0, {from: investor2})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }

        assert.equal(await deal.checkDestroyed(0), false)
    })
})