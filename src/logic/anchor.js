"use_strict"
/**
 * Anchor
 */
const aliases = require("@cosmic-plus/base/es5/aliases")
const helpers = require("@cosmic-plus/jsutils/es5/misc")
const Projectable = require("@cosmic-plus/jsutils/es5/projectable")

/**
 * Definition
 */

const Anchor = module.exports = class Anchor extends Projectable {
  static resolve (pubkey) {
    return Anchor.table[pubkey] || new Anchor(pubkey)
  }

  constructor (pubkey) {
    super()

    this.pubkey = pubkey
    this.alias = aliases.all[pubkey]
    this.name = helpers.shorter(this.alias || this.pubkey)
    Anchor.table[pubkey] = this

    this.assets = {}
  }
}

Anchor.table = {}

/**
 * Known Anchors
 */

Anchor.known = {
  "USD:GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX": "USD",
  "WSD:GDSVWEA7XV6M5XNLODVTPCGMAJTNBLZBXOFNQD3BNPNYALEYBNT6CE2V": "USD",
  "USD:GDSRCV5VTM3U7Y3L6DFRP3PEGBNQMGOWSRTGSBWX6Z3H6C7JHRI4XFJP": "USD",
  "USD:GBUYUAI75XXWDZEKLY66CFYKQPET5JR4EENXZBUZ3YXZ7DS56Z4OKOFU": "USD",
  "CNY:GAREELUB43IRHWEASCFBLKHURCGMHE5IF6XSE7EXDLACYHGRHM43RFOX": "CNY",
  "XCN:GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY": "CNY",
  "BCNY:GBCNYBHAAPDSU3UIHXXQTHYZVSBJBI4YUNWXMKJBCPDHTVYR75G6NFHD": "CNY",
  "EURT:GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S": "EUR",

  "SLT:GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP": null,
  "MOBI:GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH": null,
  "SHX:GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH": null,
  "RMT:GDEGOXPCHXWFYY234D2YZSPEJ24BX42ESJNVHY5H7TWWQSYRN5ZKZE3N": null,
  "TERN:GDGQDVO6XPFSY4NMX75A7AOVYCF5JYGW2SHCJJNWCQWIDGOZB53DGP6C": null,
  "PEDI:GBVUDZLMHTLMZANLZB6P4S4RYF52MVWTYVYXTQ2EJBPBX4DZI2SDOLLY": null,
  "GRAT:GAJ7V3EMD3FRWAPBEJAP7EC4223XI5EACDZ46RFMY5DYOMCIMWEFR5II": null,
  "REPO:GCZNF24HPMYTV6NOEHI7Q5RJFFUI23JKUKY3H3XTQAFBQIBOHD5OXG3B": null,

  "BTC:GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH": null,
  "BTC:GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF": null,
  "BTC:GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P": null,
  "BTC:GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5": null,
  "ETH:GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P": null,
  "ETH:GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5": null,
  "ETH:GBETHKBL5TCUTQ3JPDIYOZ5RDARTMHMEKIO2QZQ7IOZ4YC5XV3C2IKYU": null,
  "ETH:GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR": null,
  "LTC:GC5LOR3BK6KIOK7GKAUD5EGHQCMFOGHJTC7I3ELB66PTDFXORC2VM5LP": null,
  "LTC:GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5": null,
  "LTC:GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P": null,
  "XRP:GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5": null,
  "XRP:GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P": null,
  "KIN:GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR": null,
  "BAT:GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR": null,
  "ZRX:GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR": null,
  "BCH:GAEGOS7I6TYZSVHPSN76RSPIVL3SELATXZWLFO4DIAFYJF7MPAHFE7H4": null,
  "STEEM:GB3KBOFUCVTWEZ7YIZ7PAKLQMKPCTGWU3LOMANMCT7V6I3AAK4USTEEM": null,
  "SBD:GB3KBOFUCVTWEZ7YIZ7PAKLQMKPCTGWU3LOMANMCT7V6I3AAK4USTEEM": null,
  "LINK:GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR": null
}
