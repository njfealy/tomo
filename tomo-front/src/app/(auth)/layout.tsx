import "../globals.css";
import SideNav from "../../../components/SideNav";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex">
      <SideNav />

      {children}
    </div>
  );
}
