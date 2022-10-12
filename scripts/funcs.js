require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
const check = require("chai-as-promised")
const wavesTx = require("@waves/waves-transactions")
const winston = require("winston")
const { format, silly } = require("winston")

const chai = require("chai")
const chaiAsPromised = require("chai-as-promised")
const { expect } = require("chai")
const { stringToBytes } = require("@waves/ts-lib-crypto")
const { Sequelize } = require("sequelize")

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
const entryIndex = 8

const { ms, combine, timestamp, label, json, printf } = format

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

const combinedFormat = combine(
  label({ label: "Fishfactory Protocol" }),
  timestamp(),
  ms(),
  myFormat
)

const logger = winston.createLogger({
  level: "silly",
  transports: [
    new winston.transports.File({
      filename: "machine-readable.log",
      format: json(combinedFormat)
    }),
    new winston.transports.File({
      filename: "debug.log",
      format: combinedFormat
    }),
    new winston.transports.Console({
      format: combine(format.colorize(), combinedFormat)
    })
  ]
})

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "testDB.db",
  logging: (msg) => logger.info(msg)
})

async function testSequelize() {
  try {
    await sequelize.authenticate()
    console.log("Connection has been established successfully.")
  } catch (error) {
    console.error("Unable to connect to the database:", error)
  }
}

function printDaysLeft(days_val) {
  let float_val = days_val / 1000
  let days = Math.floor(float_val)

  let j = parseFloat((float_val % 10).toPrecision(3))

  let f_hours = j * 24
  let hours = Math.floor(f_hours % 24)
  let k = f_hours - hours

  let f_min = k * 60
  let min = Math.floor(f_min % 60)

  let l = f_min - min
  let f_sec = l * 60
  let sec = Math.floor(f_sec % 60)

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

function process_error(err) {
  const regX = /@msg/
  const message = err.message.split(":")[1]
  if (message.includes("FailedTransactionError")) {
    const x = message.split("\t")
    const z = x
      .filter((error) => {
        return regX.test(error)
      })[0]
      .split("=")[1]
      .trim()
    return z
  } else {
    return message.split(":")[0].trim()
  }
}

async function getDaysLeftToClaim(userAddress, assetTicker, entryIndex) {
  const iTx = wavesTx.invokeScript(
    {
      dApp: admin,
      chainId: chainID,
      additionalFee: 50000,
      call: {
        function: "getDaysLeftToClaim",
        args: [
          { type: "string", value: userAddress },
          { type: "string", value: assetTicker },
          { type: "integer", value: entryIndex }
        ]
      }
    },
    adminSeed
  )

  return new Promise((resolve) => {
    resolve(wavesTx.broadcast(iTx, nodeUrl))
  })
}

async function deleteAsset(assetTicker) {
  const iTx = wavesTx.invokeScript(
    {
      dApp: staker,
      chainId: chainID,
      call: {
        function: "deleteAsset",
        args: [{ type: "string", value: assetTicker }]
      }
    },
    adminSeed
  )
  return new Promise((resolve) => {
    resolve(wavesTx.broadcast(iTx, nodeUrl))
  })
}

//testSequelize()

// getDaysLeftToClaim(tester2, "tXFPr", 8).catch((error) =>
//   logger.error(process_error(error))
// )
// deleteAsset("invalid asset Id").catch((error) =>
//   logger.error(process_error(error))
// )

exports.processError = process_error
