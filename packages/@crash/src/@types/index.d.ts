import { User } from "../types";

declare global {

  namespace Express {
    interface Request {
      user?: User;
      hash: string;
      token?: string;
    }
  }
}

export {};