const ReferralWeToken = artifacts.require('./ReferralWeToken')

contract('ReferralWeToken', function (accounts) {
    let refwttoken

    beforeEach('setup contract for each test', async function () {
        owner = accounts[0]
        newOwner = accounts[1]
        rootInvite = accounts[2]
        totalSupply = 1000
        tokensForTransfer = 200
        refwttoken = await ReferralWeToken.new(owner, totalSupply)
    })

    it('has an owner', async function () {
        assert.equal(await refwttoken.owner(), owner)
    })

    it ('changes owner', async function () {
        await refwttoken.transferOwnership(newOwner, {from: owner})
        assert.equal(await refwttoken.owner(), newOwner)
    })

    it ('transfers tokens to rootInvite', async function () {
        await refwttoken.transfer(rootInvite, tokensForTransfer, {from: owner})
        assert.equal(await refwttoken.balanceOf(rootInvite), tokensForTransfer)
    })

    it ('burns tokens', async function () {
        await refwttoken.transfer(rootInvite, tokensForTransfer, {from: owner})
        await refwttoken.transfer(owner, tokensForTransfer, {from: rootInvite})
        await refwttoken.burn(totalSupply, {from: owner})
        assert.equal(await refwttoken.balanceOf(owner), 0)
        assert.equal(await refwttoken.totalSupply(), 0)
    })
})