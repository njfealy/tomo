import Post from "../../../../components/Post";

const DUMMY_POSTS = [
  {
    username: "chrisfealy",
    userPictureURI: "/user.png",
    text: "This is a post",
    date: new Date(),
    liked: false
  },
];

const Home = () => {
  return (
    <div className="flex w-full justify-center bg-[#212121]">
      <div className="bg-[#313131] w-1/2 ">
        <div className="">Test</div>
        <ul className="flex flex-col items-center p-10 gap-2">
          {DUMMY_POSTS.map((post) => (
            <li>
              <Post post={post} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
