import "../globals.css";
import SideNav from "../../components/SideNav";
import { SocketProvider } from "../../context/SocketContext";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SocketProvider>
      <div className="flex flex-row h-full w-full">
        <SideNav />
        <div className="flex flex-col w-full h-full">
          
          <div className="h-full">{children}</div>
        </div>
      </div>
    </SocketProvider>
  );
}
