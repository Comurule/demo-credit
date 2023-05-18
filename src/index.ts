import express, { Application } from 'express';
import routeHandler from './base.router';
import errorHandler from './middlewares/errorHandler';

const app: Application = express();

app.use(express.json());

app.use('/api/v1', routeHandler);

app.use(errorHandler);

export default app;
