# Real-Time Meme Coin Data Aggregation Service

This service aggregates real-time cryptocurrency data from multiple DEX sources, providing a cached, sorted, and paginated API, along with WebSocket support for live updates.

**Live URL:** [https://real-time-meme-coin-data-aggregation.onrender.com](https://real-time-meme-coin-data-aggregation.onrender.com)

---

## Features

-   **Data Aggregation:** Fetches and merges token data from DexScreener and Jupiter APIs.
-   **Caching:** Uses Redis with a 30-second TTL to minimize API calls and ensure fast responses.
-   **Real-time Updates:** A background job checks for price changes every 15 seconds and broadcasts updates to connected clients via WebSockets.
-   **REST API:** A robust endpoint for fetching the initial token list.
    -   Dynamic Sorting (by market cap, volume, price change, etc.)
    -   Cursor-based Pagination
    -   Filtering by top gainers over a time period (1h, 24h, 7d).

---

## Tech Stack

-   **Runtime:** Node.js with TypeScript
-   **Framework:** Express.js
-   **Cache:** Redis
-   **Real-time:** Socket.io
-   **HTTP Client:** Axios with `axios-retry` for exponential backoff
-   **Task Scheduling:** `node-cron`

---

## Design Decisions

-   **Caching Strategy:** A global cache key is used with a 30-second TTL. This provides a good balance between data freshness and API rate-limit protection. The background job bypasses this cache to ensure it always fetches fresh data for comparison.
-   **Data Merging:** Data from DexScreener is prioritized as it provides more complete real-time information (like `price_sol`). Jupiter data is used as a fallback for tokens not found on DexScreener.
-   **Real-time Approach:** A cron job runs on the server to poll for updates. This is a simple and reliable pattern that prevents every connected client from triggering their own fetches, making the system highly scalable.

---

## API Documentation

**Endpoint:** `GET /api/v1/tokens`

**Query Parameters:**

| Parameter | Example | Description |
|-----------|---------|-------------|
| `sortBy` | `volume_sol` | Sorts the results. Defaults to `market_cap_sol`. |
| `order` | `asc` | Sort order (`asc` or `desc`). Defaults to `desc`. |
| `limit` | `10` | Number of results per page. Defaults to `20`. |
| `cursor` | `hy1opf2bqRDwAxoktyWAj6f3UpeHcLydzEdKjMYGs2u` | The `token_address` of the last item from the previous page. |
| `timePeriod` | `24h` | Filters for top gainers over `1h`, `24h`, or `7d`. |

---

## How to Run Locally

This project requires Node.js and a running Redis instance.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/explorer271/Real-time-Meme-Coin-Data-Aggregation-Service.git
    cd Real-time-Meme-Coin-Data-Aggregation-Service
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start Redis**
    In a separate terminal window, start the Redis server.
    ```bash
    redis-server
    ```

4.  **Run the Application**
    In another terminal window, start the development server.
    ```bash
    npm run dev
    ```

5.  The service will now be available at `http://localhost:3000`.