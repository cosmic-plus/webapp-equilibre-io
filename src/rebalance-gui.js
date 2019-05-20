"use_strict"
/**
 * Target Graphical User Interface
 */
const Gui = require("@cosmic-plus/domutils/es5/gui")
const i18n = require("@cosmic-plus/i18n")
const html = require("@cosmic-plus/domutils/es5/html")
const { __ } = i18n

const SideFrame = require("./helpers/side-frame")
const Order = require("./logic/order")
const Target = require("./logic/target")
const TargetSetup = require("./widgets/target-setup")
const TargetsTable = require("./widgets/targets-table")

/**
 * Class
 */

class RebalanceGui extends Gui {
  constructor (portfolio) {
    super(`
<section class="RebalanceGui">
  <h2>${__("Rebalance")}</h2>

  %table

  %setup

  <section hidden=%hideControls>
    <form onsubmit="return false" hidden=%hideRebalance>
      <button onclick=%rebalance disabled=%invalid>${__("Rebalance")}</button>
    </form>

    <form onsubmit="return false" hidden=%hideApply>
      <button onclick=%apply disabled=%invalid>${__("Save")}</button>
      <button onclick=%cancel>${__("Cancel")}</button>
    </form>

    %toParagraph:error
  </section>

</section>
    `)

    this.portfolio = portfolio

    // Load & bind template from localStorage.
    const targetKey = `target:${portfolio.account.id}`
    const template = localStorage[targetKey]
    this.target = Target.forPortfolio(portfolio, template)
    this.target.link("json", localStorage, targetKey, null, { init: false })

    // Targets table.
    this.table = new TargetsTable(this.target)
    this.table.project("selected", this)
    this.project("selected", this.table)

    // Target Setup.
    this.trap("selected", () => {
      if (this.setup) this.setup.destroy()
      if (this.selected) {
        this.setup = new TargetSetup(this.selected)
        this.setup.listen("close", () => this.selected = null)
      } else {
        this.setup = null
      }
    })

    // Control Panel.
    this.target.project(["error", "modified"], this)

    this.define("hideControls", ["hideRebalance", "hideApply"], () => {
      return this.hideRebalance && this.hideApply
    })
    this.define("hideRebalance", ["selected", "modified"], () => {
      return this.selected || this.modified
    })
    this.define("hideApply", ["selected", "modified"], () => {
      return this.selected || !this.modified
    })
    this.define("invalid", ["error"], () => !!this.error)
  }

  toParagraph (error) {
    if (error) return html.create("p", ".error", error)
  }

  cancel () {
    location.reload()
  }

  apply () {
    this.target.json = this.target.toJson()
    this.target.modified = false
  }

  rebalance () {
    // TODO: Move this logic to Order & Offers models.
    const operations = listOperations(this.target)
    const outdated = this.portfolio.offers.filter(offer => offer.outdated)
    const remaining = outdated.filter(offer => {
      return !operations.find(op => op.offer.id === offer.id)
    })
    operations.forEach(op => {
      if (!op.offer.id && remaining.length) op.offer.id = remaining.pop().id
    })

    if (!operations.length) return false
    const cosmicLink = Order.operationsToCosmicLink(operations)
    remaining.forEach(offer => {
      cosmicLink.addOperation("manageOffer", { amount: 0, offerId: offer.id })
    })
    if (cosmicLink) {
      const sideFrame = new SideFrame(cosmicLink.uri)
      sideFrame.listen("destroy", () => {
        this.portfolio.getAccount()
        this.portfolio.offers.get()
      })
    }
  }
}

function listOperations (target) {
  let operations = []
  target.childs.forEach(child => {
    if (child.order) operations = operations.concat(child.order.operations)
  })
  return operations
}

/**
 * Export
 */

module.exports = RebalanceGui
