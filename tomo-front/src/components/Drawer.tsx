import Notifications from "./Notifications";
import {Notification} from "../types/notification"
import Search from "./Search";

const Drawer = (props: { type: string, data: Notification[] }) => {
  return (
    <div className="bg-[#262626] absolute border-r-2 border-gray-200 w-[25vw] h-full inset-x-22">
      <div>{props.type === "notifications" && <Notifications notifications={props.data} />}</div>
      <div>{props.type === "search" && <Search />}</div>
    </div>
  );
};

export default Drawer;
