import dotenv from 'dotenv';              
import express, { Request, Response } from 'express';             
import morgan from 'morgan';              
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs'

import { Controller } from './Controllers/Controller';
import { logger } from './Library/util/logger'

try
{
    //load .env
    dotenv.config();
    //express router
    const server = express();
    //use json middleware to allow json encoded requisition body
    server.use(express.json());
    //use urlencoded middleware to allow encoded url in requisitions
    server.use(express.urlencoded({extended : true}));
    //use HTTP logger middleware, common apache format
    server.use(morgan('common'));
    // secure HTTP headers
    server.use(helmet());

    //server port
    const port = +(process.env.PORT ?? 3000);

    server.use('/prefix', Controller);

    //serve api-doc endpoint based on auto generated swagger-file
    //if the file does not exist, the program is not terminated but
    // the endpoint is not served
    try
    {
        const swaggerFile = readFileSync('./doc/swagger.json', 'utf-8')
        server.use('/api-doc', swaggerUi.serve, swaggerUi.setup(JSON.parse(swaggerFile)));
    } 
    catch (e)
    {
        logger.warn("Could not find documentation file, /api-doc not available.");
    }

    //not found page
    server.all('*', async (req : Request, res : Response) => { 
        res.status(404).send(
            `<h3 style="text-align:center">404! Page not found.</h3>
            <hr/>
            <p style="text-align:center">Please verify your URI</p>`
        ); 
    }); 
    
    //server startup
    server.listen(port, () => logger.info(`Server listening to port ${port}`));
} 
catch (e : any)
{
    logger.fatal(e.message);
    process.exit(1);
}