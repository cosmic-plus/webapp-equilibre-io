"use strict"
/**
 * Orderbook class
 */

const cosmicLib = require("cosmic-lib")
const Projectable = require("@cosmic-plus/jsutils/es5/projectable")
const StellarSdk = require("@cosmic-plus/base/es5/stellar-sdk")
const { timeout } = require("@cosmic-plus/jsutils/es5/misc")
const { __ } = require("@cosmic-plus/i18n")

const { fixed7 } = require("../helpers/misc")

const Orderbook = module.exports = class Orderbook extends Projectable {
  static forBalance (balance, quote) {
    if (balance.asset === quote) return

    const orderbook = new Orderbook({ balance, quote })
    orderbook.streamOffers()

    return orderbook
  }

  static forAsset (asset) {
    return new Orderbook({ asset })
  }

  constructor (params) {
    super()

    if (params.balance) {
      this.type = "native"
      this.balance = params.balance
      this.base = params.balance.asset
      this.quote = params.quote
      this.name = `${this.base.code}/${this.quote.code}`
      this.offersCallBuilder = Orderbook.offersCallBuilder(this.balance)

      this.watch(this.quote, "price", () => this.updateOffersPrices())
    } else if (params.asset) {
      this.type = "agregated"
      this.base = params.asset
      this.name = `${this.base.code} (${__("Agregated")})`
      this.childs = []
    }

    this.watch(this.base, "globalPrice", () => this.compute("price"))
  }

  static offersCallBuilder (balance) {
    const baseAsset = new StellarSdk.Asset(balance.code, balance.anchor.pubkey)
    const quoteAsset = StellarSdk.Asset.native()
    const server = cosmicLib.resolve.server()
    return server.orderbook(baseAsset, quoteAsset)
  }

  async streamOffers () {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.getOffers()
      await timeout(15000)
    }
  }

  async getOffers () {
    try {
      const offers = await this.offersCallBuilder.limit(200).call()
      this.ingest(offers)
    } catch (error) {
      console.error(error)
    }
  }

  ingest (offers) {
    if (!areOffersEquals(this.bids, offers.bids)) {
      this.bids = normalizeOffers(offers.bids, this.quote, this.balance, "bids")
    }
    if (!areOffersEquals(this.asks, offers.asks)) {
      this.asks = normalizeOffers(offers.asks, this.quote, this.balance, "asks")
    }
  }

  updateOffersPrices () {
    if (this.bids) {
      this.set("bids", updateOffersPrices(this.bids, this.quote))
    }
    if (this.asks) {
      this.set("asks", updateOffersPrices(this.asks, this.quote))
    }
  }

  mergeOffers (side) {
    if (this.childs.length < 2) {
      this.set(side, this.childs[0] && this.childs[0][side])
      return
    }

    /// Merge order books
    const merged = this.childs.reduce((merged, child) => {
      return child[side] ? merged.concat(child[side]) : merged
    }, [])
    if (!merged.length) {
      this[side] = null
      return
    }

    const sortOffers =
      side === "bids"
        ? (a, b) => b.price - a.price
        : (a, b) => a.price - b.price

    /// Update volumes.
    let volume = 0,
      baseVolume = 0,
      quoteVolume = 0
    this.set(
      side,
      merged.sort(sortOffers).map((row) => {
        const mergedRow = Object.assign({}, row)
        mergedRow.volume = volume += fixed7(row.amount * row.price)
        mergedRow.baseVolume = baseVolume += +row.amount
        mergedRow.quoteVolume = quoteVolume += +row.quoteAmount
        return mergedRow
      })
    )
  }

  addChild (orderbook) {
    this.childs.push(orderbook)
    this.watch(orderbook, "bids", () => this.mergeOffers("bids"))
    this.watch(orderbook, "asks", () => this.mergeOffers("asks"))
  }
}

Orderbook.define("bestBid", "bids", function () {
  return this.bids && this.bids[0] && this.bids[0].price
})
Orderbook.define("bestAsk", "asks", function () {
  return this.asks && this.asks[0] && this.asks[0].price
})
Orderbook.define("midpoint", ["bestBid", "bestAsk"], function () {
  return (this.bestBid + this.bestAsk) / 2
})
Orderbook.define("price", ["midpoint"], function () {
  if (this.base.globalPrice) return this.midpoint
  else return this.marketPrice()
})
Orderbook.define("spread", ["bestBid", "bestAsk"], function () {
  return this.bestAsk - this.bestBid
})
Orderbook.define("spread%", ["spread", "bestAsk"], function () {
  return 100 * this.spread / this.bestAsk
})

/**
 * Utilities
 */

/**
 * Returns whether or not an orderbook offers has been fetched at least once.
 * Agregated orderbooks return `true` only when each child orderbook has been
 * fetched.
 */
Orderbook.prototype.isFetched = function () {
  if (this.childs) {
    return this.childs.reduce((and, child) => and && child.isFetched(), true)
  } else {
    return this.asks != null && this.bids != null
  }
}

/**
 * Look for the best first offer in **orderbook** **side** that match **filter**
 * (if provided) among child orderbooks.
 *
 * @param  {Orderbook} orderbook [description]
 * @param  {String}    side      `bids` or `asks`
 * @param  {Function}  [filter]  A filter that is passed by the returned offer
 * @return {Object}    An orderbook offer
 */
Orderbook.prototype.findOffer = function (side, filter) {
  const offers = this[side]
  const childsNum = this.childs ? this.childs.length : 1
  const anchors = {}

  let last
  for (let index in offers) {
    const offer = offers[index]
    if (filter && !filter(offer)) continue
    const anchor = offer.balance.anchor.pubkey
    if (!anchors[anchor]) {
      anchors[anchor] = true
      last = offer
    }
    if (Object.keys(anchors).length === childsNum) break
  }
  return last
}

Orderbook.prototype.findAsk = function (filter) {
  return this.findOffer("asks", filter)
}
Orderbook.prototype.findBid = function (filter) {
  return this.findOffer("bids", filter)
}

/**
 * Returns the price of asset at **depth** XLM of orderbook's **side**.
 *
 * @param  {String} [side="bids"] Either "bids" or "asks"
 * @param  {Number} [depth] The depth to look at, in term of XLM
 * @return {Number} Offer price at requested depth
 */
Orderbook.prototype.marketPrice = function (side = "bids", depth = 50) {
  const offer = this.findOffer(side, (offer) => offer.quoteVolume > depth)
  return offer ? offer.price : 0
}

/**
 * Helpers
 */

function areOffersEquals (array1, array2) {
  if (!array1) return false
  if (array1.length !== array2.length) return false
  for (let index in array1.length) {
    if (array1[index].amount !== array2[index].amount) return false
    if (array1[index].price !== array2[index].price) return false
  }
  return true
}

function normalizeOffers (offers, quote, balance, side) {
  offers.forEach((row) => {
    row.volume = undefined
    row.baseVolume = undefined
    row.basePrice = +row.price
    row.quoteAmount = +row.amount
    row.quoteVolume = undefined
    row.balance = balance
    row.side = side
  })
  return updateOffersPrices(offers, quote)
}

function updateOffersPrices (offers, quote) {
  let volume = 0,
    quoteVolume = 0,
    baseVolume = 0
  offers.forEach((row) => {
    if (row.side === "asks") {
      row.quoteAmount = fixed7(row.amount * row.basePrice)
    } else {
      row.amount = fixed7(row.quoteAmount / row.basePrice)
    }
    row.price = fixed7(row.basePrice * quote.price)
    row.volume = volume += fixed7(row.amount * row.price)
    row.baseVolume = baseVolume += +row.amount
    row.quoteVolume = quoteVolume += +row.quoteAmount
  })
  return offers
}
