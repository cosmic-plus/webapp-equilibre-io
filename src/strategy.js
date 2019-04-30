"use_strict"
/**
 * Rebalancing strategies
 */
const strategy = exports

const nice = require("@cosmic-plus/jsutils/es5/nice")
const { __ } = require("@cosmic-plus/i18n")

const global = require("./global")

/**
 * Applicator
 */

strategy.apply = function (target) {
  const delayed = []
  let sum = 0,
    weights = 0

  target.childs.forEach(child => {
    const mode = child.mode
    if (mode === "weight") {
      delayed.push(child)
      weights += child.size
    } else {
      strategy[mode](child)
      sum += child.value
    }
  })

  const remains = Math.max(0, target.value - sum)
  delayed.forEach(child => strategy.weight(child, remains, weights))

  checkAllocationLimits(sum, target.value, delayed.length)
}

function checkAllocationLimits (allocated, available, checkUnderFlag) {
  if (allocated > available) {
    const over = +nice(allocated - available, 2)
    const overP = +nice(100 * over / available, 2)
    let msg = __("Rebalance setup is over portfolio value by")
    msg += ` ${over} ${global.currency} (${overP}%) `
    throw new Error(msg)
  } else if (!checkUnderFlag && allocated < available) {
    const under = +nice(available - allocated, 2)
    const underP = +nice(100 * under / available, 2)
    let msg = __("Rebalance setup is under portfolio value by")
    msg += ` ${under} ${global.currency} (${underP}%) `
    throw new Error(msg)
  }
}

/**
 * Strategies
 */

strategy.amount = function (target) {
  target.amount = target.size
  target.value = target.amount * target.asset.price
  target.compute("share")
}

strategy.ignore = function (target) {
  target.value = target.asset.value
  target.amount = target.asset.amount
  target.compute("share")
}

strategy.percentage = function (target) {
  strategy.weight(target, target.parent.value, 100)
}

strategy.weight = function (target, remains, weights) {
  if (!weights) {
    target.value = target.amount = 0
  } else {
    target.value = target.size * remains / weights
    target.amount = +nice(target.value / target.asset.price, 7)
  }
  target.compute("share")
}
