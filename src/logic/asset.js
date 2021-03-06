"use strict"
/**
 * Asset class
 */

const AUTO_REFRESH_PRICES = true
const CRYPTO_PRICES_REFRESH_DELAY = 60 * 1000
const FIAT_PRICES_REFRESH_DELAY = 60 * 60 * 1000
const FIAT_BASEURL = "https://www.xe.com/themes/xe/images/flags/svg/"
const FIAT_IMAGEFORMAT = ".svg"

const Mirrorable = require("@cosmic-plus/jsutils/es5/mirrorable")
const Projectable = require("@cosmic-plus/jsutils/es5/projectable")

const marketData = require("./market-data")
const Orderbook = require("./orderbook")
const {
  fixed7,
  arrayContains,
  arrayRemove,
  arraySum
} = require("../helpers/misc")

/**
 * Class
 */

const Asset = module.exports = class Asset extends Projectable {
  static resolve (id, params) {
    return Asset.table[id] || new Asset(id, params)
  }

  constructor (id, params) {
    super()
    if (params) Object.assign(this, params)

    this.id = id
    Asset.table[id] = this

    // Empty image by default
    this.image = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="

    if (this.type) {
      this.code = id
      if (this.type === "fiat") {
        Asset.fiats.push(this)
        this.image = `${FIAT_BASEURL}${id.toLowerCase()}${FIAT_IMAGEFORMAT}`
        this.useGlobalPrice = true
      } else {
        Asset.cryptos.push(this)
        this.type = "crypto"
        if (this.isTether || this.id === "XLM") this.useGlobalPrice = true
      }
    } else {
      this.code = id.replace(/:.*/, "")
      this.name = this.code
      this.type = "unknown"
    }

    this.anchors = new Mirrorable()
    this.balances = new Mirrorable()
    this.offers = new Mirrorable()

    this.balances.mirror((balance) => {
      this.watch(balance, "amount", () => this.compute("amount"))
      this.watch(balance, ["buying", "selling"], () => {
        this.compute("liabilities")
      })
    })

    this.orderbook = Orderbook.forAsset(this)
    this.define("price", "globalPrice", () => {
      return this.globalPrice || this.orderbook.price
    })
    this.watch(this.orderbook, "price", () => this.compute("price"))
  }

  maybeAddBalance (balance) {
    if (arrayContains(this.balances, balance)) return
    this.balances.push(balance)
    if (!balance.orderbook) balance.streamPrice()
  }

  maybeRemoveBalance (balance) {
    arrayRemove(this.balances, balance)
  }

  async getInfo () {
    // Happens once & only for cryptos.
    if (this.name || this.type !== "crypto") return
    this.info = await marketData.crypto.info(this)
    this.name = this.info.name
    this.image = this.info.image.small
  }

  async getHistoricPrice () {
    if (this.historicPrice) return this.historicPrice

    this.historicPrice = await marketData.assetHistory(this)
    if (!this.historicPrice) return

    // Keep today's price in sync.
    this.trap("price", () => {
      const dailyData = this.historicPrice[this.historicPrice.length - 1]
      dailyData.price = this.price
    })

    return this.historicPrice
  }
}

Asset.define("amount", "balances", function () {
  return this.balances && fixed7(arraySum(this.balances, "amount"))
})

Asset.define("value", ["amount", "price"], function () {
  return this.amount === 0 ? 0 : this.amount * this.price
})

Asset.define("valueMin", ["amountMin", "price"], function () {
  return !this.amountMin ? 0 : this.amountMin * this.price
})

Asset.define("liabilities", ["balances", "price"], function () {
  if (this.balances) {
    const rawLiabilities = this.balances.reduce(
      (sum, entry) => sum + entry.buying - entry.selling,
      0
    )
    return this.price * rawLiabilities
  }
})

Asset.define("isSupported", ["type", "price"], function () {
  return !!(this.type !== "unknown" || this.price)
})

/**
 * Utilities
 */

/**
 * Registers **assets** as known assets, assigns **params** to them.
 */
Asset.register = function (assets, defaults) {
  for (let code in assets) {
    const params = Object.assign({}, defaults, assets[code])
    Asset.resolve(code, params)
  }
}

/**
 * Get general information (name, logo, ...) for all known assets.
 */
Asset.getAllInfo = function () {
  const assets = Object.values(Asset.table)
  assets.forEach((asset) => asset.getInfo())
}

Asset.refreshPrices = async function (array) {
  if (!array) {
    await Asset.refreshCryptoPrices()
    await Asset.refreshFiatPrices()
  } else {
    await Asset.refreshCryptoPrices(
      array
        .filter((asset) => asset.type === "crypto")
        .map((asset) => asset.code)
    )
    await Asset.refreshFiatPrices(
      array.filter((asset) => asset.type === "fiat").map((asset) => asset.code)
    )
  }
}

Asset.refreshCryptoPrices = async function (assets = Asset.cryptos) {
  if (!assets.length) return
  const prices = await marketData.crypto.prices(assets)
  assets.forEach((asset) => {
    if (asset.useGlobalPrice) asset.globalPrice = prices[asset.code]
  })
}

Asset.refreshFiatPrices = async function (fiats = Asset.fiats) {
  if (!fiats.length) return
  const prices = await marketData.fiat.prices(fiats)
  fiats.forEach((asset) => {
    if (asset.useGlobalPrice) asset.globalPrice = prices[asset.code]
  })
}

/**
 * Init
 */

Asset.table = {}
Asset.cryptos = []
Asset.fiats = []

// Automatic global price refresh
if (AUTO_REFRESH_PRICES) {
  setInterval(Asset.refreshCryptoPrices, CRYPTO_PRICES_REFRESH_DELAY)
  setInterval(Asset.refreshFiatPrices, FIAT_PRICES_REFRESH_DELAY)
}

// eslint-disable-next-line no-console
console.log(Asset.table)
