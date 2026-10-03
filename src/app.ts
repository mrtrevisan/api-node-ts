import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './docs/openapi';
import { errorHandler, notFound } from './middlewares/errors';
import { requestLogger } from './middlewares/requestLogger';
import { router } from './routes';

export const app = express();

app.use(requestLogger);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// before the router, otherwise GET /:code would capture /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(router);

app.use(notFound);
app.use(errorHandler);
