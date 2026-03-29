declare namespace Express {
  export interface Request {
    RequestUser?: {
      sub: string;
      email_verified: boolean;
      name: string;
      preferred_username: string;
      given_name: string;
      family_name: string;
      email: string;
    };
  }
}
