import { Request } from "express";

export interface ICustomRequest extends Request {
    user:{
      id: string;
      role:string;
      iat:Number;
      exp:Number;
    }
  }