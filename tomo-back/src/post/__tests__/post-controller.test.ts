import * as postController from "../post-controller";
import * as postModel from "../post-model";
import express from "express";

import { CreatePostRequest } from "../post.types";
import { InsertOneResult, ObjectId, WithId } from "mongodb";
import { ApiError } from "@App/utils/api-error";

jest.mock("../post-model");

describe("createPostController", () => {
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: express.NextFunction;

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
    (postModel.insertPost as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: null,
    } as unknown as InsertOneResult<postModel.Post>);

    await postController.createPost(
      mockReq as express.Request<{}, {}, CreatePostRequest>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Post created" });
  });

  it("should return 500 if InsertOneResult unacknowledged", async () => {
    (postModel.insertPost as jest.Mock).mockResolvedValue({
      acknowledged: false,
      insertedId: null,
    } as unknown as InsertOneResult<postModel.Post>);

    await postController.createPost(
      mockReq as express.Request<{}, {}, CreatePostRequest>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });

  it("should return 500 if InsertOneResult is null", async () => {
    (postModel.insertPost as jest.Mock).mockResolvedValue({
      acknowledged: false,
      insertedId: null,
    } as unknown as InsertOneResult<postModel.Post>);

    await postController.createPost(
      mockReq as express.Request<{}, {}, CreatePostRequest>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });
});

describe("deletePostController", () => {
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: express.NextFunction;

  beforeEach(() => {
    mockReq = { body: { postId: new ObjectId().toString() } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return 204 if deletePostById found Post", async () => {
    (postModel.deletePostById as jest.Mock).mockResolvedValue({
      _id: mockReq.body.postId,
      creator: new ObjectId(),
      text: "fake post test",
    } as WithId<postModel.Post>);

    await postController.deletePost(
      mockReq as express.Request<{postId: string}>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Post ID=${mockReq.body.postId} deleted`,
    });
  });

  it("should return 404 if deletePostById did not find Post ", async () => {
    (postModel.deletePostById as jest.Mock).mockResolvedValue(null);

    await postController.deletePost(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext as express.NextFunction
    );

    expect(mockNext).toHaveBeenCalledWith(
      new ApiError(`Could not find Post ID=${mockReq.body.postId}`, 404)
    );
  });

  describe("getPostController", () => {
    let mockReq: Partial<express.Request<{ postId: string }>>;
    let mockRes: Partial<express.Response>;
    let mockNext: express.NextFunction;

    beforeEach(() => {
      mockReq = { params: { postId: new ObjectId().toString() } };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it("should return 200 and the Post if Post ID exists", async () => {
      const mockPost: postModel.Post = {
        creator: new ObjectId(),
        text: "fake post text",
      };

      (postModel.findPostById as jest.Mock).mockReturnValue(mockPost);

      await postController.getPost(
        mockReq as express.Request<{ postId: string }, {}>,
        mockRes as express.Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPost);
    });

    it("should return 404 if Post ID does not exist", async () => {
      (postModel.findPostById as jest.Mock).mockReturnValue(null);

      await postController.getPost(
        mockReq as express.Request<{ postId: string }, {}>,
        mockRes as express.Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        new ApiError(`Could not find Post ID=${mockReq.params!.postId}`, 404)
      );
    });
  });
});
