require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
const wavesTx = require("@waves/waves-transactions")

const admin = process.env.admin
const staker = process.env.staker
const reserve = process.env.reserve
const stakerSeed = process.env.stakerSeed
const reserveSeed = process.env.reserveSeed
const adminSeed = process.env.adminSeed
const nodeUrl = process.env.NODE_URL
const adminScript = process.env.adminScript
const stakerScript = process.env.stakerScript
const reserveScript = process.env.reserveScript
const chainID = process.env.chainID

const helper = require("./funcs")

async function deployStaker() {
  const sSTx = wavesTx.setScript(
    {
      script: stakerScript,
      fee: 1500000,
      addtionalFee: 400000,
      chainId: chainID
    },
    stakerSeed
  )

  await wavesTx
    .broadcast(sSTx, nodeUrl)
    .then(console.log)
    .catch((err) => {
      console.log(err)
      process.exit(-1)
    })

  await wavesTx
    .waitForTx(sSTx.id, { apiBase: nodeUrl })
    .then(async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          call: {
            function: "init",
            args: [{ type: "string", value: admin }]
          },
          payment: null,
          chainId: chainID
        },
        stakerSeed
      )

      await wavesTx.broadcast(iTx, nodeUrl).then(console.log)
      await wavesTx.waitForTx(iTx.id, { apiBase: nodeUrl }).then(console.log)
    })
    .catch((err) => {
      console.log(err)
    })
}

async function deployAdmin() {
  const sSTx = wavesTx.setScript(
    {
      script: adminScript,
      fee: 1500000,
      addtionalFee: 400000,
      chainId: chainID
    },
    adminSeed
  )

  await wavesTx
    .broadcast(sSTx, nodeUrl)
    .then(console.log)
    .catch((err) => {
      console.log(err)
      process.exit(-1)
    })

  await wavesTx
    .waitForTx(sSTx.id, { apiBase: nodeUrl })
    .then(async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: admin,
          call: {
            function: "init",
            args: [{ type: "string", value: staker }]
          },
          payment: null,
          chainId: chainID
        },
        adminSeed
      )

      await wavesTx.broadcast(iTx, nodeUrl).then(console.log)
      await wavesTx.waitForTx(iTx.id, { apiBase: nodeUrl })
    })
    .catch((err) => {
      console.log(err)
    })
}

async function deployReserve() {
  const sSTx = wavesTx.setScript(
    {
      script: reserveScript,
      fee: 1500000,
      addtionalFee: 400000,
      chainId: chainID
    },
    reserveSeed
  )

  await wavesTx
    .broadcast(sSTx, nodeUrl)
    .then(console.log)
    .catch((err) => {
      console.log(err)
      console.log(err)
    })

  await wavesTx
    .waitForTx(sSTx.id, { apiBase: nodeUrl })
    .then(async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: reserve,
          call: {
            function: "init",
            args: [
              { type: "string", value: staker },
              { type: "string", value: admin }
            ]
          },
          payment: null,
          chainId: chainID
        },
        reserveSeed
      )

      await wavesTx.broadcast(iTx, nodeUrl).then(console.log)
      await wavesTx.waitForTx(iTx.id, { apiBase: nodeUrl })
    })
    .catch((err) => {
      console.log(err)
    })
}

// deployStaker()
// deployReserve()
// Promise.resolve(deployStaker).then(async () => {
//   await deployAdmin().then(async () => {
//     await deployReserve()
//   })
// })()
;(async () => {
  await deployStaker().then(async () => {
    await deployAdmin().then(async () => {
      await deployReserve()
    })
  })
})()
