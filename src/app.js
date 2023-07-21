const express = require('express');
const bodyParser = require('body-parser');
const {sequelize, Sequelize} = require('./model')
const {or, and, gt, lt, ne, is} = Sequelize.Op;
const {getProfile} = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)


/**
 * POST /jobs/:job_id/pay - Pay for a job, a client can only pay if his balance >= the amount to pay. The amount should be moved from the client's balance to the contractor balance.
 *
 * POST /balances/deposit/:userId - Deposits money into the the the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
 *
 * GET /admin/best-profession?start=<date>&end=<date> - Returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.
 *
 * GET /admin/best-clients?start=<date>&end=<date>&limit=<integer> - returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2.
 */


/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const currentUser = req.profile

    const contract = await Contract.findOne({where: {id}})

    console.log(JSON.stringify(contract))

    if (!contract) return res.status(404).end()

    if (contract.ContractorId !== currentUser.id || contract.ClientId !== currentUser.id) {
        return res.status(403).end()
    }
    res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
    const {Contract} = req.app.get('models')
    const currentUser = req.profile

    // TODO add pagination
    const contracts = await Contract.findAll({
        where: {
            [or]: [
                {ClientId: currentUser.id},
                {ContractorId: currentUser.id},
            ],
            [and]: [
                {status: {[ne]: "terminated"}},
            ]
        }
    })

    res.json(contracts)
})


// GET /jobs/unpaid - Get all unpaid jobs for a user (either a client or contractor), for active contracts only.
app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const {Job, Contract} = req.app.get('models')
    const currentUser = req.profile

    // TODO add pagination
    const jobs = await Job.findAll({
        where: {
            [or]: {
                paid: false,
                paid: { [is]: null }
            }
        },
        include: {
            model: Contract,
            where: {
                [or]: [
                    {ClientId: currentUser.id},
                    {ContractorId: currentUser.id},
                ]
            }
        }
    })

    res.json(jobs)
})

module.exports = app;
