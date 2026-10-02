import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFound } from './middlewares/errors';
import { requestLogger } from './middlewares/requestLogger';
import { router } from './routes';

export const app = express();

app.use(requestLogger);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/prefix', router);

app.use(notFound);
app.use(errorHandler);
