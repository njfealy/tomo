export const getPost = async (postId: string) => {
  const response = await fetch(`http://localhost:5001/posts/${postId}`, {
    method: "GET",
  });

  const data = await response.json();
  return data;
};

export const getAllPosts = async () => {
  const response = await fetch(`http://localhost:5001/posts/`, {
    method: "GET",
  });

  const data = await response.json();
  return data;
};

export const createPost = async (postText: string) => {
  const body = JSON.stringify({ postText });
  const response = await fetch(`http://localhost:5001/posts`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body,
  });

  const data: { message: string; _id: string } = await response.json();
  return data;
};

export const deletePost = async (postId: string) => {
  const response = await fetch(`http://localhost:5001/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const data: { message: string } = await response.json();
  return data;
};

export const likePost = async (postId: string) => {
  const response = await fetch(`http://localhost:5001/posts/${postId}/like`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  return data;
};

export const unlikePost = async (postId: string) => {
  const response = await fetch(`http://localhost:5001/posts/${postId}/unlike`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  console.log(data)
  return data;
};

export const makeComment = async (postId: string, commentText: string) => {
  const body = JSON.stringify({ commentText });
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    }
  );

  const data: { message: string; commentId: string } = await response.json();
  return data;
};

export const deleteComent = async (postId: string, commentId: string) => {
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments/${commentId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return data;
};

export const editComment = async (
  postId: string,
  commentId: string,
  newText: string
) => {
  const body = JSON.stringify({ newText });
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments/${commentId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    }
  );

  const data = await response.json();
  return data;
};

export const likeComment = async (postId: string, commentId: string) => {
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments/${commentId}/like`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return data;
};

export const unlikeComment = async (postId: string, commentId: string) => {
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments/${commentId}/unlike`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  console.log(response.status);
  const data = await response.json();
  return data;
};

export const replyToComment = async (
  postId: string,
  commentId: string,
  replyText: string
) => {
  const body = JSON.stringify({
    replyText,
  });
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments/${commentId}/replies`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    }
  );
  console.log(response.status);
  const data: { insertedId: string } = await response.json();
  return data;
};

export const likeReply = async (postId: string, commentId: string, replyId: string) => {
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return data;
};

export const unlikeReply = async (postId: string, commentId: string, replyId: string) => {
  const response = await fetch(
    `http://localhost:5001/posts/${postId}/comments/${commentId}/replies/${replyId}/unlike`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return data;
};