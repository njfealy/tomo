import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full max-w-screen overflow-hidden h-full">
      <AuthProvider>
        <body className="w-full h-full overscroll-none ">{children}</body>
      </AuthProvider>
    </html>
  );
}
