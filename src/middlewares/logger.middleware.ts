import { Request, Response, NextFunction } from 'express';

const logger = (req: Request, _: Response, next: NextFunction): void => {
    let color = "";

    switch (req.method) {
        case "GET":
            color = "\x1b[32m"; // Green
            break;
        case "POST":
            color = "\x1b[34m"; // Blue
            break;
        case "PATCH":
            color = "\x1b[33m"; // Yellow
            break;
        case "DELETE":
            color = "\x1b[31m"; // Red
            break;
        default:
            color = "\x1b[36m"; // Cyan
            break;
    }

    console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} ${new Date()}`);
    next();
};

export { logger };
