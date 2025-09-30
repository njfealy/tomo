import { Notification } from "@/types/notification";
import NotificationCard from "./Notification/NotificationCard";

const Notifications = (props: { notifications: Notification[] | null }) => {
  return (
    <div className="w-full p-2">
      <ul>
        {props.notifications && props.notifications.length > 0 ? (
          props.notifications.map((notif) => (
            <li key={notif._id}>
              <NotificationCard notification={notif} />
            </li>
          ))
        ) : (
          <li className="text-[#D0D0D0]">No notifications.</li>
        )}
      </ul>
    </div>
  );
};

export default Notifications;
