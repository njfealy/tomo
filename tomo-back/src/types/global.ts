export {};

declare global {
  namespace Express {
    interface User {
      _id: string;
      displayName: string;
    }
  }
}

declare module "http" {
  interface IncomingMessage {
    user?: Express.User;
  }
}
