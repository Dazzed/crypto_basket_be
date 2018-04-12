const key          = process.env.KRAKEN_API_KEY; // API Key
const secret       = process.env.KRAKEN_SECRET_KEY; // API Private Key
const KrakenClient = require('kraken-api');
const kraken       = new KrakenClient(key, secret);

const krakenMap = {
    'BCHUSD': [['bch', 'usd'],['usd', 'bch']],
    'BCHXBT': [['bch', 'btc'],['btc', 'bch']],
    'DASHUSD': [['dash', 'usd'],['usd', 'dash']],
    'DASHXBT': [['dash', 'btc'],['btc', 'dash']],
    'XETHXXBT': [['eth', 'btc'],['btc', 'eth']],
    'XETHZUSD': [['eth', 'usd'],['usd', 'eth']],
    'XLTCXXBT': [['ltc', 'btc'],['btc', 'ltc']],
    'XLTCZUSD': [['ltc', 'usd'],['usd', 'ltc']],
    'XXBTZUSD': [['btc', 'usd'],['usd', 'btc']],
    'XXLMXXBT': [['xlm', 'btc'],['btc', 'xlm']],
    'XXMRXXBT': [['xmr', 'btc'],['btc', 'xmr']],
    'XXMRZUSD': [['xmr', 'usd'],['usd', 'xmr']],
    'XXLMZUSD': [['xlm', 'usd'],['usd', 'xlm']],
    'XXRPXXBT': [['xrp', 'btc'],['btc', 'xrp']],
    'XXRPZUSD': [['xrp', 'usd'],['usd', 'xrp']],
    'XZECXXBT': [['zec', 'btc'],['btc', 'zec']],
    'XZECZUSD': [['zec', 'usd'],['usd', 'zec']]
};

const krakenData = async () => {
    let krakenData = {};
    const krakData = await kraken.api('Ticker', { pair: 'BCHUSD,BCHXBT,DASHUSD,DASHXBT,XETHXXBT,XETHZUSD,XLTCXXBT,XLTCZUSD,XXBTZUSD,XXLMXXBT,XXLMZUSD,XXMRXXBT,XXMRZUSD,XXRPXXBT,XXRPZUSD,XZECXXBT,XZECZUSD'});
    const keys = Object.keys(krakenMap);
    for(const key in keys){
        const properKey = keys[key];
        const tickerPair = krakData.result[properKey];
        const firstKey = krakenMap[properKey][0][0];
        const secondKey = krakenMap[properKey][0][1];
        if(!(firstKey in krakenData))
            krakenData[firstKey] = {};
        if(!(secondKey in krakenData))
            krakenData[secondKey] = {};
        krakenData[firstKey][secondKey] = {
            bid: tickerPair.b[0],
            ask: tickerPair.a[0],
            price: tickerPair.c[0]
        };
        // krakenData[secondKey][firstKey] = {
        //     bid: tickerPair.a[0],
        //     ask: tickerPair.b[0],
        //     price: tickerPair.c[0]
        // };
    }
    return krakenData;
}

module.exports = async function(app) {
    const assets = await app.models.asset.find({});
    const krakData = await krakenData();
    console.log(krakData);
  // for(assetIndex in assets){
  //   const currentAsset = assets[assetIndex];
  //   for(const key in currentAsset.exchangeRates){
  //   }
  // }
};