import { Response } from 'express';

export function databaseError(res: Response, err: any)
{
    console.log(err);
    res.status(500).json({
        error: "Database error"
    });
}