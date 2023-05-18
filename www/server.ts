import http from 'http';
import logger from '../src/utils/logger';
import app from '../src';

const server = http.createServer(app);
const port = process.env.PORT || 8000;

server.listen(port, () => {
  logger.info(`Listening on PORT: ${port}`);
});
