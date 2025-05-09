import Notifications from "./Notifications";

const Drawer = (props: { type: string }) => {
  return (
    <div className="bg-[#262626] fixed border-r-2 border-gray-200 w-[20vw] inset-x-22">
      <div>{props.type === "notifications" && <Notifications />}</div>
    </div>
  );
};

export default Drawer;
