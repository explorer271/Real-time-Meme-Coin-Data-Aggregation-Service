import { Token } from '../types/token';
import * as apiClient from './apiClient';
import cacheService from './cacheService';

const CACHE_KEY = 'tokens:all';
const CACHE_TTL_SECONDS = 30;

export const getAggregatedTokens = async (query: string = 'SOL', forceRefresh: boolean = false): Promise<Token[]> => {
  if (!forceRefresh) {
    const cachedData = await cacheService.get(CACHE_KEY);
    if (cachedData) {
      console.log('Returning data from cache');
      return JSON.parse(cachedData);
    }
  }

  console.log(forceRefresh ? 'Forcing refresh...' : 'Cache miss. Fetching from APIs...');
  const [dexScreenerTokens, jupiterTokens] = await Promise.all([
    apiClient.fetchFromDexScreener(query),
    apiClient.fetchFromJupiter(query),
  ]);

  const tokenMap = new Map<string, Token>();

  // DexScreener prioritized as it has more complete data
  dexScreenerTokens.forEach(token => tokenMap.set(token.token_address, token));
  jupiterTokens.forEach(token => {
    if (!tokenMap.has(token.token_address)) {
      tokenMap.set(token.token_address, token);
    }
  });

  const mergedTokens = Array.from(tokenMap.values());

  if (mergedTokens.length > 0) {
    await cacheService.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(mergedTokens));
  }

  return mergedTokens;
};