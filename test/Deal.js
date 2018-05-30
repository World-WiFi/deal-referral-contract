const Deal = artifacts.require('./Deal.sol')
const WTToken = artifacts.require('./WeToken')
const ReferralContract = artifacts.require('./ReferralContract')

contract('Deal', function (accounts) {
    let wetoken
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
        deal = await Deal.new(wttoken.address, owner)
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
    })

    it ('creates campaign', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(investor2, 2500)

        await wttoken.transfer(deal.address, 1000, {from: investor1})
        await wttoken.transfer(deal.address, 1500, {from: investor2})

        assert.equal(await deal.getAddressCreatorById(0), investor1)
        assert.equal(await deal.getAddressCreatorById(1), investor2)

        assert.equal(await wttoken.balanceOf(deal.address), 2500)

    })

    it ('adds tokens to campaign', async function() {
        await wttoken.transfer(investor1, 1500)

        await wttoken.transfer(deal.address, 1000, {from: investor1})

        assert.equal(await deal.getTokenAmountForCampaign(0), 1000)

        await wttoken.approve(deal.address, 500, {from: investor1})
        await deal.addTokensToCampaign(0, 500, {from: investor1})

        assert.equal(await deal.getTokenAmountForCampaign(0), 1500)
    })

    it ('does not add tokens to campaign because not enaugh approved tokens', async function() {
        await wttoken.transfer(investor1, 2500)

        await wttoken.transfer(deal.address, 1000, {from: investor1})

        assert.equal(await deal.getTokenAmountForCampaign(0), 1000)

        await wttoken.approve(deal.address, 500, {from: investor1})
        try {
            await deal.addTokensToCampaign(0, 800, {from: investor1})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }

        assert.equal(await deal.getTokenAmountForCampaign(0), 1000)
    })

    it ('destroys campaign', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(deal.address, 1500, {from: investor1})

        assert.equal(await deal.checkStatus(0), 0)
        assert.equal(await wttoken.balanceOf(deal.address), 1500)
        assert.equal(await wttoken.balanceOf(investor1), 0)

        await deal.destroyCampaign(0, {from: owner})

        assert.equal(await deal.checkStatus(0), 1)
        assert.equal(await wttoken.balanceOf(deal.address), 0)
        assert.equal(await wttoken.balanceOf(investor1), 1500)

    })

    it ('does not destroy campaign because sender to not equal owner', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(deal.address, 1500, {from: investor1})

        assert.equal(await deal.checkStatus(0), 0)
        assert.equal(await wttoken.balanceOf(deal.address), 1500)
        assert.equal(await wttoken.balanceOf(investor1), 0)
        
        try {
            await deal.destroyCampaign(0, {from: investor1})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }

        assert.equal(await deal.checkStatus(0), 0)
        assert.equal(await wttoken.balanceOf(deal.address), 1500)
        assert.equal(await wttoken.balanceOf(investor1), 0)
    })

    it ('sends coins to router owners', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(investor2, 2500)

        await wttoken.transfer(deal.address, 1500, {from: investor1})
        await wttoken.transfer(deal.address, 2500, {from: investor2})

        await deal.sendCoin([routerOwner1, routerOwner2], [300, 700], 0)
        await deal.sendCoin([routerOwner3, routerOwner4], [1000, 1500], 1)

        assert.equal(await wttoken.balanceOf(routerOwner1), 300)
        assert.equal(await wttoken.balanceOf(routerOwner2), 700)
        assert.equal(await wttoken.balanceOf(routerOwner3), 1000)
        assert.equal(await wttoken.balanceOf(routerOwner4), 1500)

        assert.equal(await wttoken.balanceOf(investor1), 500)
        assert.equal(await wttoken.balanceOf(investor2), 0)

        assert.equal(await deal.checkStatus(0), 2)
        assert.equal(await deal.checkStatus(0), 2)
    })

    it ('does not send coins to router owners because wrong number of tokens', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(deal.address, 1500, {from: investor1})

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [300, 1700], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because campaign finished', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(deal.address, 1500, {from: investor1})
        await deal.sendCoin([routerOwner1, routerOwner2], [300, 700], 0)

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [200, 300], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because campaign destroyed', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(deal.address, 1500, {from: investor1})
        await deal.destroyCampaign(0, {from: owner})

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [200, 300], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because wrong quantity router owners', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(deal.address, 1500, {from: investor1})
        
        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [200], 0)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because sender not contract owner', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(deal.address, 1500, {from: investor1})

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [200, 1200], 0, {from: investor1})
        } catch (error) {
            assert.equal(await wttoken.balanceOf(routerOwner1), 0)
            assert.equal(await wttoken.balanceOf(routerOwner2), 0)
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

})