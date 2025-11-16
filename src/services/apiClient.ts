import axios from 'axios';
import axiosRetry from 'axios-retry';
import { Token } from '../types/token';

const apiClient = axios.create();

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return error.response?.status === 429;
  },
});

// --- DexScreener ---
const normalizeDexScreener = (pair: any): Token | null => {

  const priceUsd = parseFloat(pair.priceUsd);
  const priceNative = parseFloat(pair.priceNative);

  if (!priceUsd || !priceNative) {
    return null;
  }

  const usdToSolRatio = priceNative / priceUsd;
  const marketCapSol = (pair.marketCap ?? 0) * usdToSolRatio;
  const liquiditySol = (pair.liquidity?.usd ?? 0) * usdToSolRatio;

  return {
    token_address: pair.baseToken.address,
    token_name: pair.baseToken.name,
    token_ticker: pair.baseToken.symbol,
    price_sol: priceNative,
    market_cap_sol: marketCapSol,
    volume_sol: pair.volume?.h24 ?? 0,
    liquidity_sol: liquiditySol,
    transaction_count: (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0),
    price_1hr_change: pair.priceChange?.h1 ?? 0,
    price_24hr_change: pair.priceChange?.h24 ?? 0,
    price_7d_change: 0,
    protocol: pair.dexId,
  };
};

export const fetchFromDexScreener = async (query: string): Promise<Token[]> => {
  try {
    const response = await apiClient.get(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
    const pairs = response.data.pairs || [];

    const solanaPairs = pairs.filter((p: any) => p.chainId === 'solana');

    return solanaPairs
      .slice(0, 20)
      .map(normalizeDexScreener)
      .filter((t: Token | null): t is Token => t !== null);

  } catch (error) {
    console.error('Error fetching from DexScreener:', error);
    return [];
  }
};

// --- Jupiter ---
const normalizeJupiter = (token: any): Token => {
  // Endpoint provides metadata and USD prices, not prices in SOL.
  return {
    token_address: token.id,
    token_name: token.name,
    token_ticker: token.symbol,
    price_sol: 0,
    market_cap_sol: 0, // mcap is in USD
    volume_sol: 0,
    liquidity_sol: 0,
    transaction_count: 0,
    price_1hr_change: token.stats1h?.priceChange ?? 0,
    price_24hr_change: token.stats24h?.priceChange ?? 0,
    price_7d_change: token.stats7d?.priceChange ?? 0,
    protocol: 'Jupiter',
  };
};

export const fetchFromJupiter = async (query: string): Promise<Token[]> => {
  try {
    // API URL is for searching tokens, not getting real-time prices in SOL.
    const response = await apiClient.get(`https://lite-api.jup.ag/ultra/v1/search?query=${query}`);
    const tokens = response.data || [];
    return tokens.slice(0, 20).map(normalizeJupiter);
  } catch (error) {
    console.error('Error fetching from Jupiter:', error);
    return [];
  }
};