"use strict"
/**
 * Target Setup Form
 */
const Gui = require("@cosmic-plus/domutils/es5/gui")

const nice = require("@cosmic-plus/jsutils/es5/nice")
const { __ } = require("@cosmic-plus/i18n")

module.exports = class TargetSetup extends Gui {
  constructor (target) {
    super(`
<section class="TargetSetup">
  <form onsubmit="return false">

    <h3>%name</h3>
    <hr>

    <label><span>${__("Size")}:</span>

      <input class="half" type="number" step="any" min="0" %max
        value=%size placeholder=%share onchange=%maybeSwitchMode>

      <select class="half" onchange=%setMode value=%mode>
        <option value="weight">${__("Weight")}</option>
        <option value="percentage">${__("Percentage")}</option>
        <option value="amount">${__("Amount")}</option>
        <option value="ignore" hidden=%targetIsXlm>${__("Ignore")}</option>
      </select>

    </label>

    <hr>
    <input type="submit" onclick=%close value="${__("Close")}">

  </form>
</section>
    `)

    this.target = target
    this.name = target.asset.name
    this.targetIsXlm = target.asset.id === "XLM"

    target.project("share", this, x => nice(100 * x, 2))

    target.project("size", this)
    this.project("size", target, x => x != null ? Number(x) : null)

    target.project("mode", this)
    this.project("mode", target)
  }

  maybeSwitchMode () {
    if (this.size === 0) {
      this.mode = "amount"
    } else if (!this.size) {
      this.mode = "ignore"
    } else if (this.mode === "ignore") {
      this.mode = "percentage"
      this.target.computeAll()
    }
  }

  setMode () {
    // TODO: Move this logic to Target model.
    switch (this.mode) {
    case "weight":
      this.size = 1
      this.max = null
      break
    case "percentage":
      this.size = +nice(100 * this.target.asset.share, 2)
      this.max = 100
      break
    case "amount":
      this.size = this.target.asset.amount
      this.max = null
      break
    case "ignore":
      this.size = null
      break
    }
  }

  close () {
    this.maybeSwitchMode()
    this.trigger("close")
    this.destroy()
  }
}
