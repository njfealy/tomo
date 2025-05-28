import express from "express";
import * as commentController from "@App/comment/comment-controller";
import * as commentModel from "@App/comment/comment-model";
import * as postModel from "@App/post/post-model";
import * as mongo from "@App/utils/mongo";
import { ObjectId } from "mongodb";
import { ApiError } from "@App/utils/api-error";

jest.mock("@App/comment/comment-model");
jest.mock("@App/post/post-model");
jest.mock("@App/utils/mongo");

describe("makeCommmentController", () => {
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
      body: {
        creatorId: new ObjectId().toString(),
        commentText: "Fake comment text",
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return with 201 on success", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (commentModel.insertComment as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: new ObjectId(),
    });
    (postModel.addCommentToPost as jest.Mock).mockResolvedValue({
      _id: new ObjectId(),
      creator: new ObjectId(),
      text: "Fake post text",
    });

    await commentController.makeComment(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Comment made on Post ID =${mockReq.params!.postId}`,
    });
  });

  it("should return next with 500 if insertComment fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (commentModel.insertComment as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await commentController.makeComment(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });

  it("should return next with 500 if addToPost fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (commentModel.insertComment as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: new ObjectId(),
    });
    (postModel.addCommentToPost as jest.Mock).mockResolvedValue(null)

    await commentController.makeComment(
      mockReq as express.Request<{ postId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error"));
  });
});
