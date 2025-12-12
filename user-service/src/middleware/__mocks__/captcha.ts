import { NextFunction, Request, Response } from "express";

export const verifyCaptcha = jest
  .fn()
  .mockImplementation((req: Request, res: Response, next: NextFunction) => {
    next();
  });
