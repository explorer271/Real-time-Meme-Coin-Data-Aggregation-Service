import { Request, Response } from 'express';
import { getAggregatedTokens } from '../services/aggregationService';
import { Token } from '../types/token';

export const getTokens = async (req: Request, res: Response) => {
  try {
    let tokens = await getAggregatedTokens();

    const timePeriod = req.query.timePeriod as string;

    if (timePeriod) {
      const filterKeyMap = {
        '1h': 'price_1hr_change',
        '24h': 'price_24hr_change',
        '7d': 'price_7d_change'
      };

      const filterKey = filterKeyMap[timePeriod as keyof typeof filterKeyMap] as keyof Token;

      if (filterKey) {
        tokens = tokens.filter(token => (token[filterKey] as number) > 0);
      }
    }

    const sortBy = req.query.sortBy as keyof Token || 'market_cap_sol';
    const order = req.query.order || 'desc';

    tokens.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return order === 'asc' ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    let startIndex = 0;
    if (cursor) {
      const cursorIndex = tokens.findIndex(t => t.token_address === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedTokens = tokens.slice(startIndex, startIndex + limit);

    const nextCursor = paginatedTokens.length === limit ? paginatedTokens[paginatedTokens.length - 1].token_address : null;

    res.status(200).json({
      tokens: paginatedTokens,
      nextCursor,
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch token data', error });
  }
};