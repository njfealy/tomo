export {};

declare global {
  namespace Express {
    interface User {
      displayName: string;
      googleId: string;
    }
  }
}
