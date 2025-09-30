import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_HOST } from "@/lib/config";

interface User {
    displayName: string,
    _id: string,
    pictureUri: string,
};

const Search = () => {
  const [input, setInput] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[] | null>(null)

  const inputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (input.length > 0) {
        const body = JSON.stringify({ search: input });
        const res = await fetch(`${API_HOST}/users/search/`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body,
        });
        const data = await res.json();
        console.log(data);
        if(data == null) return setSearchResults(null);
        return setSearchResults(data)
      } return setSearchResults(null)
    }, 1000);
    return () => clearTimeout(timeout);
  }, [input]);

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="text-white">Search</div>
      <div className="flex justify-center">
        <input
          placeholder="Search..."
          value={input}
          onChange={inputChangeHandler}
          className="bg-white focus:outline-hidden py-1 px-3 rounded-l-2xl"
        />
        <div className="flex items-center bg-white rounded-r-2xl px-3">
          {input.length > 0 && (
            <button className="bg-[#777777] leading-none text-white p-1 rounded-full"></button>
          )}
        </div>
        
      </div>
      {
            searchResults != null && <ul className="flex flex-col gap-1 mt-4">
                {searchResults.map(user => <li key={user._id}>
                    <Link href={"/"+user._id}>
                    <div className="flex bg-white rounded-xl px-2 py-1 items-end gap-3">
                        <Image src={user.pictureUri} alt={""} width={40} height={40} />
                        <div>{user.displayName}</div>
                    </div>
                    </Link>
                </li>)}
            </ul>
        }
    </div>
  );
};

export default Search;
