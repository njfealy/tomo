type ButtonType = "primary" | "secondary" | "warning";

const Button = (props: {
  children: React.ReactNode;
  type: ButtonType;
  onClick?: () => any;
}) => {
  return (
    <button
      onClick={props.onClick}
      className={`px-2 py-0.5 rounded text-[#DDDDDD] hover:text-white transition duration-200 ${
        (props.type === "primary" && "bg-blue-600 hover:bg-blue-300") ||
        (props.type === "secondary" && "bg-[#555555] hover:bg-[#888888]") ||
        (props.type === "warning" && "bg-red-600 hover:bg-red-400")
      }`}
    >
      {props.children}
    </button>
  );
};

export default Button;
