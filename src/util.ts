import util = require('util');
import request = require('request');

import { Response } from 'express';

export const requestP = util.promisify(request);

export function databaseError(res: Response, err: any)
{
    console.log(err);
    res.status(500).json({
        error: "Database error"
    });
}