import express from "express";
import * as postController from "@App/post/post-controller";

import * as postModel from "@App/post/post-model";
import * as userModel from "@App/user/user-model";
import * as commentModel from "@App/comment/comment-model";
import * as mongo from "@App/utils/mongo";

import { CreatePostRequest } from "@App/post/post.types";
import { InsertOneResult, ObjectId, WithId } from "mongodb";
import { ApiError } from "@App/utils/api-error";

jest.mock("@App/post/post-model");
jest.mock("@App/user/user-model");
jest.mock("@App/comment/comment-model");
jest.mock("@App/utils/mongo");

describe("createPostController", () => {
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: express.NextFunction;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeEach(() => {
    mockReq = {
      body: { creatorId: new ObjectId().toString(), postText: "test text" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return 201 if InsertOneResult acknowledged", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (postModel.insertPost as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: new ObjectId(),
    } as unknown as InsertOneResult<postModel.Post>);
    (userModel.addPostToUser as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });

    await postController.createPost(
      mockReq as express.Request<{}, {}, CreatePostRequest>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Post created" });
  });

  it("should call next with error if insertPost fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (postModel.insertPost as jest.Mock).mockResolvedValue({
      acknowledged: false,
    } as unknown as InsertOneResult<postModel.Post>);

    await postController.createPost(
      mockReq as express.Request<{}, {}, CreatePostRequest>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });

  it("should call next with error if addToUser fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (postModel.insertPost as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: new ObjectId(),
    });

    (userModel.addPostToUser as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await postController.createPost(
      mockReq as express.Request<{}, {}, CreatePostRequest>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });
});

describe("deletePostController", () => {
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: express.NextFunction;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeEach(() => {
    mockReq = {
      params: { postId: new ObjectId().toString() },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return 204 if success", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (postModel.deletePostById as jest.Mock).mockResolvedValue({
      _id: new ObjectId(mockReq.params!.postId),
      creator: new ObjectId(),
      text: "fake post text",
    } as WithId<postModel.Post>);
    (commentModel.deleteCommentsByPostId as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.pullPostFromUser as jest.Mock).mockReturnValue({
      acknowledged: true,
    });

    await postController.deletePost(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Deleted Post with ID=${mockReq.params!.postId}`,
    });
  });

  it("should return 404 if deletePostById fails ", async () => {
    (postModel.deletePostById as jest.Mock).mockResolvedValue(null);

    await postController.deletePost(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError(`Could not find Post with ID=${mockReq.params!.postId}`, 404)
    );
  });

  it("should return next 500 if deleteCommentsByPostId fails", async () => {
    (postModel.deletePostById as jest.Mock).mockResolvedValue({
      _id: new ObjectId(),
      creator: new ObjectId(),
      text: "fake post text",
    } as WithId<postModel.Post>);

    (commentModel.deleteCommentsByPostId as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await postController.deletePost(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });

  it("should return next with 500 if pullPostFromUser fails", async () => {
    (postModel.deletePostById as jest.Mock).mockResolvedValue({
      _id: new ObjectId(),
      creator: new ObjectId(),
      text: "fake post text",
    } as WithId<postModel.Post>);
    (commentModel.deleteCommentsByPostId as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.pullPostFromUser as jest.Mock).mockResolvedValue({
      acknowledge: false,
    });

    await postController.deletePost(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });
});

describe("getPostController", () => {
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: express.NextFunction;

  beforeEach(() => {
    mockReq = { params: { postId: new ObjectId().toString() } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn()
  });

  it("should return 200 and Post if success", async () => {
    const mockPost: postModel.Post = {creator: new ObjectId(),
      text: "fake post text",};

    (postModel.findPostById as jest.Mock).mockResolvedValue(mockPost);

    await postController.getPost(
      mockReq as express.Request<{postId: string}>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockPost);
  });

  it("should return 404 if failure", async () => {
    (postModel.findPostById as jest.Mock).mockResolvedValue(null);

    await postController.getPost(
      mockReq as express.Request<{postId: string}>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(new ApiError(`Could not find Post ID=${mockReq.params!.postId}`, 404));
  });
});