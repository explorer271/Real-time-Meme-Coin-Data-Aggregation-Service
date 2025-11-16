import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { getTokens } from './controllers/tokenController';
import { startTokenUpdater } from './jobs/tokenUpdater';

const app = express();
const port = 3000;

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server);

app.get('/health', (req, res) => res.status(200).send('Service is healthy'));
app.get('/api/v1/tokens', getTokens);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  startTokenUpdater();
});

export { io };