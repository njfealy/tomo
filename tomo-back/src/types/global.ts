export {};

declare global {
  namespace Express {
    interface User {
      displayName: string;
      googleId: string;
    }
  }
}

declare module "http" {
  interface IncomingMessage {
    user?: Express.User;
  }
}
