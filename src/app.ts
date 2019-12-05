import express = require('express');

import { createServer } from 'http';
import { HTTP_PORT } from './config/http';
import { MainRouter } from './routes';

const app = express();
app.use(express.json());
app.use(MainRouter);

const server = createServer(app);

server.listen(HTTP_PORT, () =>
{
    console.log("HTTP server is running on port:" + HTTP_PORT);
});
