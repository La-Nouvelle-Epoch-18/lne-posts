import jwt = require('jsonwebtoken');

import { Request, Response, NextFunction } from 'express';

import { requestP } from './util';
import { AUTH_SERVICE_URL } from './config/auth';

export async function authenticated(req: Request, res: Response, next: NextFunction)
{
    const token = extractAuthToken(req);
    if (token)
    {
        try
        {
            const result = await requestP({
                method: 'POST',
                url: AUTH_SERVICE_URL + "/auth/verify",
                headers: {
                    "authorization": "bearer " + token
                }
            });
            if (result.statusCode == 200)
            {
                const data = jwt.decode(token);
                if(data)
                {
                    req.decoded = data as any;
                    next();
                }
                else
                {
                    res.status(result.statusCode).json({
                        error: "Invalid token"
                    });
                }
            }
            else
            {
                res.status(result.statusCode).json({
                    error: "Invalid token"
                });
            }
        }
        catch (err)
        {
            console.log(err);
            res.status(500).json({
                error: "Error while contacting auth service"
            });
        }
    }
    else
    {
        res.status(401).json({
            error: "Authorization header do not contains a valid token"
        });
    }
}

export function extractAuthToken(req: Request): string | undefined
{
    const authorization = req.headers['authorization'];
    if (authorization && typeof authorization == 'string')
    {
        const parsedHeader = authorization.split(' ', 2);
        if (parsedHeader.length == 2 && parsedHeader[0].toLowerCase() == 'bearer')
        {
            return parsedHeader[1];
        }
    }
    return undefined;
}
