const key           = process.env.KRAKEN_API_KEY; // API Key
const secret        = process.env.KRAKEN_SECRET_KEY; // API Private Key
const KrakenClient  = require('kraken-api');
const kraken        = new KrakenClient(key, secret);
const Binance       = require('binance-api-node').default;
const binanceClient = Binance();
const _ = require('lodash');
// Ethereum
// Ripple
// Bitcoin Cash
// Litecoin
// Stellar
// Monero
// ZCash
// Dash
// Cardano
// btc
// eth
// xrp
// bch
// ltc
// xlm
// xmr
// xmr
// dash
// ada
const krakenMap = {
  'BCHUSD': ['bch', 'usd'],
  'BCHXBT': ['bch', 'btc'],
  'DASHUSD': ['dash', 'usd'],
  'DASHXBT': ['dash', 'btc'],
  'XETHXXBT': ['eth', 'btc'],
  'XETHZUSD': ['eth', 'usd'],
  'XLTCXXBT': ['ltc', 'btc'],
  'XLTCZUSD': ['ltc', 'usd'],
  'XXBTZUSD': ['btc', 'usd'],
  'XXLMXXBT': ['xlm', 'btc'],
  'XXMRXXBT': ['xmr', 'btc'],
  'XXMRZUSD': ['xmr', 'usd'],
  'XXLMZUSD': ['xlm', 'usd'],
  'XXRPXXBT': ['xrp', 'btc'],
  'XXRPZUSD': ['xrp', 'usd'],
  'XZECXXBT': ['zec', 'btc'],
  'XZECZUSD': ['zec', 'usd']
};
const nonBTCETHAssets = [
  'xrp',
  'bch',
  'ltc',
  'xlm',
  'xmr',
  'xmr',
  'dash',
  'ada'
];

const krakenData = async () => {
  let krakenData = {};
  const krakData = await kraken.api('Ticker', { pair: 'BCHUSD,BCHXBT,DASHUSD,DASHXBT,XETHXXBT,XETHZUSD,XLTCXXBT,XLTCZUSD,XXBTZUSD,XXLMXXBT,XXLMZUSD,XXMRXXBT,XXMRZUSD,XXRPXXBT,XXRPZUSD,XZECXXBT,XZECZUSD'});
  const keys = Object.keys(krakenMap);
  for (const key in keys) {
    const properKey = keys[key];
    const tickerPair = krakData.result[properKey];
    const firstKey = krakenMap[properKey][0];
    const secondKey = krakenMap[properKey][1];
    if (!(firstKey in krakenData))
      krakenData[firstKey] = {};
    krakenData[firstKey][secondKey] = {
      bid: tickerPair.b[0],
      ask: tickerPair.a[0],
      price: tickerPair.c[0]
    };
  }
  return krakenData;
};

const getBinanceKeys = ticker => {
  let firstTicker = '';
  let secondTicker = '';
  if (ticker.startsWith('BTC') || ticker.startsWith('ETH') || ticker.startsWith('LTC')) {
    firstTicker = ticker.slice(0, 3).toLowerCase();
    secondTicker = ticker.slice(3, 10).toLowerCase();
  } else if (ticker.endsWith('BTC') || ticker.endsWith('ETH')) {
    firstTicker = ticker.slice(0, -3).toLowerCase();
    secondTicker = ticker.slice(-3).toLowerCase();
  } else {
    return null;
  }
  if (firstTicker === 'usdt') {
    firstTicker = 'usd';
  }
  if (secondTicker === 'usdt') {
    secondTicker = 'usd';
  }
  return [firstTicker, secondTicker];
};

const binanceData = async () => {
  let binanceDats = {};
  const binancePrices = await binanceClient.prices();
  const binanceBidAsk = await binanceClient.allBookTickers();
  const tickers = _.keys(binancePrices);
  const tickersIncluded = _.filter(tickers, ticker => {
    return (ticker.startsWith('ETH') || ticker.startsWith('BTC') || ticker.endsWith('ETH') || ticker.endsWith('BTC') || ticker.endsWith('USDT') || ticker.endsWith('USDT')) && nonBTCETHAssets.some(tick=>{
      const lowerCase = ticker.toLowerCase();
      return lowerCase.includes(tick);
    });
  });
  const fullTickersToInclude = ['BTCUSDT', 'ETHUSDT', ...tickersIncluded];
  const prices = _.pick(binancePrices, fullTickersToInclude);
  const bidAsks = _.filter(binanceBidAsk, elem => {
    return fullTickersToInclude.some(tick => {
      return tick === elem.symbol;
    });
  });
  for (const index in bidAsks) {
    const elem = bidAsks[index];
    const symbol = elem.symbol;
    const keys = getBinanceKeys(symbol);
    const price = prices[symbol];
    _.set(binanceDats, [...keys, 'price'], price);
    _.set(binanceDats, [...keys, 'bid'], elem.bidPrice);
    _.set(binanceDats, [...keys, 'ask'], elem.askPrice);
  }
  return binanceDats;
};

module.exports = async function(app) {
    const assets = await app.models.asset.find({});
    const krakDat = await krakenData();
    const binanceDat = await binanceData();
    const mergedData = _.mergeWith(krakDat, binanceDat, (objValue, srcValue, key) => {
        if(key==='ask'){
            return objValue < srcValue ? objValue : srcValue;
        }else if(key === 'bid'){
            return objValue > srcValue ? objValue : srcValue;
        }else if(key === 'price'){
            // return objValue > srcValue ? objValue : srcValue;
            return (Number(objValue) + Number(srcValue)) / 2;
        }else{
            return undefined;
        }
    });
    for(assetIndex in assets){
        const currentAsset = assets[assetIndex];
        const exchangeRates = currentAsset.exchangeRates;
        const newRates = _.merge(exchangeRates, mergedData[currentAsset.ticker]);
        await currentAsset.updateAttribute('exchangeRates', newRates);
    }
  });
  for (assetIndex in assets) {
    const currentAsset = assets[assetIndex];
    const exchangeRates = currentAsset.exchangeRates;
    const newRates = _.merge(exchangeRates, mergedData[currentAsset.ticker]);
    await currentAsset.updateAttribute('exchangeRates', newRates);
  }
};
