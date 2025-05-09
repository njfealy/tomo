import { Notification } from "../types";
const DUMMY_NOTIFS: Notification[] = [
  {
    event: "test",
    agents: [
      {
        username: "nickfealy",
        pictureURI: "blah",
        friends: [],
        posts: [],
      },
    ],
  },
];

const Notifications = () => {
  return (
    <div>
      <ul>
        {DUMMY_NOTIFS.map((notif) => (
          <li key={1}>
            <div className="bg-white m-2 rounded-xl p-2">{`${notif.event}`}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
