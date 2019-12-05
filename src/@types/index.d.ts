declare namespace Express
{
    interface Request
    {
        decoded: {
            [key: string]: any
        };
    }
}