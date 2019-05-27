"use strict"
/**
 * Targets Table
 */
const Gui = require("@cosmic-plus/domutils/es5/gui")
const html = require("@cosmic-plus/domutils/es5/html")
const nice = require("@cosmic-plus/jsutils/es5/nice")
const { __ } = require("@cosmic-plus/i18n")

module.exports = class TargetsTable extends Gui {
  constructor (target) {
    super(`
<section class="TargetsTable">
  <table>
    <tr>
      <th>${__("Name")}</th>
      <th>${__("Goal")}</th>
      <th>${__("Divergence")}</th>
      <th>${__("Operation")}</th>
    </tr>

    %targets...

    <tr hidden=true>
      <td align="center" colspan="4"><h3>${__("Add Asset")}</h3></td>
    </tr>
  </table>
</section>
    `)

    this.targets = target.childs.mirror(child => this.toTargetRow(child))
    this.selected = undefined

    target.listen("update", () => this.sortTargets())
    this.sortTargets()
  }

  toTargetRow (target) {
    const row = new TargetRow(target)
    row.domNode.onclick = () => this.selected = target
    return row
  }

  sortTargets () {
    this.targets.sort((a, b) => {
      a = a.target
      b = b.target
      if (b.mode === "ignore" && a.mode !== "ignore") return -1
      else if (a.mode === "ignore" && b.mode !== "ignore") return 1
      return b.value - a.value || a.asset.code.localeCompare(b.asset.code)
    })
  }
}

class TargetRow extends Gui {
  constructor (target) {
    super(`
<tr class="TargetRow">
  <td align="left">
    <img src=%image alt="">
    <span>%name</span>
  </td>
  <td align="right">%command</td>
  <td align="right">%toPercent:shareDiff</td>
  <td align="right">%toDiv:description...</td>
</tr>
    `)

    this.target = target
    this.name = target.asset.code

    this.define("command", null, () => this.toCommand(target))
    this.watch(target, ["size", "mode", "share"], () => this.compute("command"))

    target.asset.project("image", this)
    target.project("shareDiff", this)

    if (target.order) target.order.project("description", this)
  }

  toCommand (target) {
    switch (target.mode) {
    case "ignore":
      return __("Ignore")
    case "amount":
      return `${target.amount} ${target.asset.code}`
    case "weight":
      return `${target.size} − ${this.toPercent(target.share)}`
    case "percentage":
      return this.toPercent(target.share)
    }
  }

  toPercent (x) {
    return !x ? "-" : nice(x * 100, 2) + "%"
  }

  toDiv (obj) {
    return html.create("div", null, obj)
  }
}