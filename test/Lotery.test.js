const assert = require(`assert`);
const ganache = require(`ganache-cli`);
const Web3 = require(`web3`);
const web3 = new Web3(ganache.provider());

const {interface, bytecode} = require(`../compile`);
const {aliases} = require("mocha/lib/cli/run-option-metadata");

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({
            data: bytecode
        })
        .send({
            from: accounts[0], gas: 1000000
        })
})


describe(`Lottery Contract`, () => {

    it('should deploys a contract', () => {

        // Ok test that value is true
        assert.ok(lottery.options.address)
    });

    it('should allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0], value: web3.utils.toWei(`0.02`, "ether")
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it('should multiple accounts to enter ', async () => {

        // Entering 3 Accounts
        await lottery.methods.enter().send({
            from: accounts[0], value: web3.utils.toWei(`0.02`, "ether")
        });
        await lottery.methods.enter().send({
            from: accounts[1], value: web3.utils.toWei(`0.02`, "ether")
        });
        await lottery.methods.enter().send({
            from: accounts[2], value: web3.utils.toWei(`0.02`, "ether")
        });

        // Calling getPlayers from [0] account
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it('should requires a minimum amount of ether to enter', async () => {

        try {
            await lottery.methods.enter().send({
                from: accounts[0], value: 0
            });
            assert(false);

        } catch (e) {
            assert.ok(e);
        }
    });

    it(`Should only manager can call the function`, async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1],

            });
            assert(false);

        } catch (e) {
            assert(e);
        }
    })

    it('should send money to the winner and reset players array', async () => {

        await lottery.methods.enter().send({
            from: accounts[0], value: web3.utils.toWei(`2`, `ether`)
        })

        // Must check that reduced 2 ethers
        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        })

        const finalBalance = await web3.eth.getBalance(accounts[0]);

        console.log(initialBalance);
        console.log(finalBalance);

        const difference = finalBalance - initialBalance;
        console.log(difference);

        // Checking balance with reduced gas amount
        assert(difference > web3.utils.toWei(`1.8`, `ether`))
    });
})