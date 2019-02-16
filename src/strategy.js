"use_strict"
/**
 * Rebalancing strategies
 */
const strategy = exports

const { __ } = require("@cosmic-plus/i18n")

strategy.apply = function (share, total) {
  if (!share.childs) return share.target = total

  let used = 0
  const computed = []
  const remaining = []
  const strat = share.mode || "equal"

  share.childs.forEach(child => {
    if (child.mode === "skip" || child.mode === "amount") {
      child.target =
        child.size != null
          ? child.asset.price * child.size
          : child.asset.price * child.asset.amount
      child.goal = 100 * child.target / total
      if (child.goal > 100) {
        child.root.errors.push(
          `${child.asset.code}: ${__("Order over portfolio total")}`
        )
      }
      used += child.goal
    } else if (child.size != null) {
      child.goal = child.size
      used += child.size
      computed.push(child)
    } else {
      remaining.push(child)
    }
  })

  if (total < 0) throw new Error("Rebalancing impossible")

  if (used > 100 || used !== 100 && !remaining.length) {
    makeTotal100(computed, used)
    remaining.forEach(share => share.goal = 0)
  } else if (remaining.length) {
    method[strat](remaining, 100 - used)
  }

  computed.concat(remaining).forEach(child => {
    strategy.apply(child, total * child.goal / 100)
  })
}

function makeTotal100 (targets, used) {
  const space = 100 - used
  targets.forEach(target => target.goal += space * target.goal / used)
}

/*******************************************************************************
 * Strategies
 */

const method = {}

method.equal = function (shares, space) {
  const goal = space / shares.length
  shares.forEach(share => share.goal = goal)
}
