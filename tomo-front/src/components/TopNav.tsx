export const TopNav = () => {
    return (<div className="flex bg-[#333333] h-12 w-full justify-center p-2">
        <input placeholder="Search..." className="bg-white rounded-l-2xl w-lg px-3 focus:outline-none" />
        <button className="flex items-center bg-[#CCCCCC] px-2 rounded-r-2xl text-sm text-[#BBBBBB] hover:bg-[#AAAAAA] hover:text-white transition duration-200">Search</button>
    </div>)
}

export default TopNav;