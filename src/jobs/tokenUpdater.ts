import cron from 'node-cron';
import { getAggregatedTokens } from '../services/aggregationService';
import cacheService from '../services/cacheService';
import { io } from '../index';
import { Token } from '../types/token';

const CACHE_KEY = 'tokens:all';

const findUpdatedTokens = (oldTokens: Token[], newTokens: Token[]): Token[] => {
  const oldTokenMap = new Map(oldTokens.map(t => [t.token_address, t]));
  const updatedTokens: Token[] = [];

  newTokens.forEach(newToken => {
    const oldToken = oldTokenMap.get(newToken.token_address);
    if (!oldToken || oldToken.price_sol !== newToken.price_sol) {
      updatedTokens.push(newToken);
    }
  });

  return updatedTokens;
};

export const startTokenUpdater = () => {
  cron.schedule('*/15 * * * * *', async () => {
    console.log('Running token updater job...');

    try {
      const oldTokensStr = await cacheService.get(CACHE_KEY);
      const oldTokens: Token[] = oldTokensStr ? JSON.parse(oldTokensStr) : [];

      const latestTokens = await getAggregatedTokens(undefined, true);
      
      const updatedTokens = findUpdatedTokens(oldTokens, latestTokens);

      if (updatedTokens.length > 0) {
        console.log(`Found ${updatedTokens.length} updated tokens. Broadcasting...`);
        updatedTokens.forEach(token => {
          io.emit('tokenUpdate', token);
        });
      }
    } catch (error) {
      console.error('Error in token updater job:', error);
    }
  });
};