require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
const check = require("chai-as-promised")
const wavesTx = require("@waves/waves-transactions")
const chai = require("chai")
const chaiAsPromised = require("chai-as-promised")
const { expect } = require("chai")

chai.use(chaiAsPromised)

const admin = process.env.admin
const adminSeed = process.env.adminSeed
const tester = process.env.tester
const testerSeed = process.env.testerSeed
const tester2 = process.env.tester2
const tester2Seed = process.env.tester2Seed
const staker = process.env.staker
const reserve = process.env.reserve
const stakerSeed = process.env.stakerSeed
const reserveSeed = process.env.reserveSeed
const nodeUrl = process.env.NODE_URL
const stakerScript = process.env.stakerScript
const reserveScript = process.env.reserveScript

const chainID = process.env.chainID
const entryIndex = 6

const XFP = {
  Ticker: "tXFP",
  AssetID: "AiWj4ipynU8mGrcgjRThTWPjPN4dNpiYvYGTmnmEsXp7",
  StakingStore: reserve,
  decimals: 2,
  minLockAmount: 200_000,
  maxLockAmount: 100_000_000
}

function printDaysLeft(days_val) {
  let float_val = days_val / 1000
  let days = Math.floor(float_val)

  let j = parseFloat((float_val % 10).toPrecision(3))

  let f_hours = j * 24
  let hours = Math.floor(f_hours)
  let k = f_hours - hours

  let f_min = k * 60
  let min = Math.floor(f_min)

  let l = f_min - min
  let f_sec = l * 60
  let sec = Math.floor(f_sec)
  console.log(
    days.toString() +
      "Days   " +
      hours.toString() +
      "Hours   " +
      min.toString() +
      "Min   " +
      sec.toString() +
      "Sec"
  )
}

describe("unauthorized invocations", () => {
  it("getAssetIdByTicker call stakerDapp", async () => {
    const iTx = wavesTx.invokeScript(
      {
        dApp: staker,
        chainId: chainID,
        call: {
          function: "_getAssetIdByTicker",
          args: [{ type: "string", value: "null" }]
        }
      },
      testerSeed
    )

    await chai
      .expect(wavesTx.broadcast(iTx, nodeUrl))
      .rejectedWith("unauthorized")
  })

  it("getAssetId call from admin dapp", async () => {
    const iTx = wavesTx.invokeScript(
      {
        dApp: admin,
        chainId: chainID,
        additionalFee: 400000,
        call: {
          function: "getAssetIdByTicker",
          args: [{ type: "string", value: XFP.Ticker }]
        }
      },
      testerSeed
    )

    await expect(wavesTx.broadcast(iTx, nodeUrl)).rejectedWith("unauthorized")
  })
})

describe("invocation & parameter validation", () => {
  xit("add an asset", async () => {
    const iTx = wavesTx.invokeScript(
      {
        dApp: staker,
        chainId: chainID,
        call: {
          function: "addAsset",
          args: [
            { type: "string", value: XFP.Ticker },
            { type: "string", value: XFP.AssetID },
            { type: "string", value: XFP.StakingStore },
            {
              type: "integer",
              value: XFP.minLockAmount * Math.pow(10, XFP.decimals)
            },
            {
              type: "integer",
              value: XFP.maxLockAmount * Math.pow(10, XFP.decimals)
            }
          ]
        }
      },
      adminSeed
    )
    await wavesTx.broadcast(iTx, nodeUrl)
  })

  it("get an asset", async () => {
    const iTx = wavesTx.invokeScript(
      {
        dApp: admin,
        chainId: chainID,
        additionalFee: 50000,
        call: {
          function: "getAssetIdByTicker",
          args: [{ type: "string", value: XFP.Ticker }]
        }
      },
      adminSeed
    )

    await wavesTx.broadcast(iTx, nodeUrl)
    await wavesTx
      .waitForTx(iTx.id, { apiBase: nodeUrl })
      .then((result) => {
        console.log(result.stateChanges.data)
      })
      .catch()
  })

  xit("delete an asset", async () => {
    const iTx = wavesTx.invokeScript(
      {
        dApp: staker,
        chainId: chainID,
        call: {
          function: "deleteAsset",
          args: [{ type: "string", value: XFP.Ticker }]
        }
      },
      adminSeed
    )
    await wavesTx.broadcast(iTx, nodeUrl)
  })

  xdescribe("Locking Functions", () => {
    it("Locking without attaching payment", async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          chainId: chainID,
          call: {
            function: "Lock",
            args: [
              { type: "integer", value: 90 },
              { type: "string", value: XFP.Ticker },
              { type: "integer", value: entryIndex }
            ]
          }
        },
        testerSeed
      )

      await expect(wavesTx.broadcast(iTx, nodeUrl)).rejectedWith(
        "attach amount you want to lock"
      )
    })

    it("Locking with invalid asset Id", async () => {
      const XFPIdToBytes = XFP.AssetID
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          chainId: chainID,
          call: {
            function: "Lock",
            args: [
              { type: "integer", value: 90 },
              { type: "string", value: "XFP.Ticker" },
              { type: "integer", value: entryIndex }
            ]
          },
          payment: [{ assetId: XFPIdToBytes, amount: 200_000 * 100 }]
        },
        testerSeed
      )

      await expect(wavesTx.broadcast(iTx, nodeUrl)).rejectedWith(
        "asset not supported"
      )
    })

    xit("Locking with invalid amount", async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          chainId: chainID,
          call: {
            function: "Lock",
            args: [
              { type: "integer", value: 60 },
              { type: "string", value: XFP.Ticker },
              { type: "integer", value: entryIndex }
            ]
          },
          payment: [{ assetId: XFP.AssetID, amount: 200_000_000 * 100 }]
        },
        testerSeed
      )

      await expect(wavesTx.broadcast(iTx, nodeUrl)).rejectedWith(
        "staking amount is out of range"
      )
    })

    xit("Locking with incorrect period", async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          chainId: chainID,
          call: {
            function: "Lock",
            args: [
              { type: "integer", value: 600 },
              { type: "string", value: XFP.Ticker },
              { type: "integer", value: entryIndex }
            ]
          },
          payment: [{ assetId: XFP.AssetID, amount: 200_000 * 100 }]
        },
        testerSeed
      )

      await expect(wavesTx.broadcast(iTx, nodeUrl)).rejectedWith(
        "invalid locking period"
      )
    })

    // wrting this like this is bad, but this is just a test code anyway :)
    it("Locking with correct parameters", async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: admin,
          chainId: chainID,
          call: {
            function: "storeAPYAmount",
            args: [
              { type: "string", value: tester2 },
              { type: "string", value: XFP.Ticker },
              { type: "integer", value: 1000 * 100 },
              { type: "integer", value: entryIndex }
            ]
          }
        },
        adminSeed
      )
      await wavesTx.broadcast(iTx, nodeUrl).catch((result) => {
        console.log(result)
      })
      await wavesTx.waitForTx(iTx.id, { apiBase: nodeUrl }).then(async () => {
        const iTx = wavesTx.invokeScript(
          {
            dApp: staker,
            chainId: chainID,
            additionalFee: 50000,
            call: {
              function: "Lock",
              args: [
                { type: "integer", value: 1 },
                { type: "string", value: XFP.Ticker },
                { type: "integer", value: entryIndex }
              ]
            },
            payment: [{ assetId: XFP.AssetID, amount: 200_000 * 100 }]
          },
          tester2Seed
        )

        await wavesTx.broadcast(iTx, nodeUrl).catch(async (result) => {
          console.log({ errorMesg: result.message })
          const iTx = wavesTx.invokeScript(
            {
              dApp: admin,
              chainId: chainID,
              call: {
                function: "deleteAPYAmount",
                args: [
                  { type: "string", value: tester2 },
                  { type: "string", value: XFP.Ticker },
                  { type: "integer", value: entryIndex }
                ]
              }
            },
            adminSeed
          )
          await wavesTx.broadcast(iTx, nodeUrl).catch((result) => {
            console.log(result)
          })
        })
      })
    })
  })

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  describe("Claim Tests", () => {
    xit("Claiming with invalid ticker", async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          chainId: chainID,
          call: {
            function: "Claim",
            args: [
              { type: "string", value: "XFP.AssetID" },
              { type: "integer", value: entryIndex }
            ]
          }
        },
        testerSeed
      )

      await expect(wavesTx.broadcast(iTx, nodeUrl)).rejectedWith("invalid asset")
    })

    it("Claiming before locking period is over", async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          chainId: chainID,
          call: {
            function: "Claim",
            args: [
              { type: "string", value: XFP.Ticker },
              { type: "integer", value: entryIndex }
            ]
          }
        },
        testerSeed
      )

      await wavesTx.broadcast(iTx, nodeUrl).catch((err) => {
        console.log(err.message)
      })
    })

    xit("Valid claim", async () => {
      const iTx = wavesTx.invokeScript(
        {
          dApp: staker,
          chainId: chainID,
          additionalFee: 50000,
          call: {
            function: "Claim",
            args: [
              { type: "string", value: XFP.Ticker },
              { type: "integer", value: entryIndex }
            ]
          }
        },
        testerSeed
      )

      await wavesTx.broadcast(iTx, nodeUrl).catch(console.log)
      await wavesTx
        .waitForTx(iTx.id, { apiBase: nodeUrl })
        .then((result) => {
          console.log(result.id)
        })
        .catch(console.log)
    })
  })
})
