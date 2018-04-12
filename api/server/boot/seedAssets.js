'use strict';

const BASE_ASSETS = [
  {
    name: "Bitcoin",
    ticker: "btc",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Ethereum",
    ticker: "eth",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Ripple",
    ticker: "xrp",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Bitcoin Cash",
    ticker: "bch",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Litecoin",
    ticker: "ltc",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Stellar",
    ticker: "xlm",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Monero",
    ticker: "xmr",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "ZCash",
    ticker: "xmr",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Dash",
    ticker: "dash",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ada: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      }
    }
  },
  {
    name: "Cardano",
    ticker: "ada",
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 0,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {
      usd: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      eth: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xrp: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      bch: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      ltc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      btc: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xlm: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      xmr: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      dash: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
      zec: {
        bid: 1.0,
        price: 1.0,
        ask: 1.0
      },
    }
  }
];

module.exports = async server => {
  try {
    const { asset } = server.models;
    for(const index in BASE_ASSETS){
      const assetInstance = await asset.findOne({ where: { ticker: BASE_ASSETS[index].ticker }});
      if(!assetInstance){
        await asset.create(BASE_ASSETS[index]);
      }
    }

  } catch (e) {
    console.error(e);
  }
};
