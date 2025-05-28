import express from "express";
import * as userController from "@App/user/user-controller";
import * as userModel from "@App/user/user-model";
import * as mongo from "@App/utils/mongo";
import * as postModel from "@App/post/post-model";
import * as commentModel from "@App/comment/comment-model";
import { ObjectId } from "mongodb";
import { ApiError } from "@App/utils/api-error";

jest.mock("@App/user/user-model");
jest.mock("@App/utils/mongo");
jest.mock("@App/post/post-model");
jest.mock("@App/comment/comment-model");

describe("createUserController", () => {
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: express.NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {
        username: "Fake username",
        email: "Fake email",
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return 201 on success", async () => {
    const mockInsertedId = new Object();
    (userModel.insertUser as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: mockInsertedId,
    });

    await userController.createUser(
      mockReq as express.Request,
      mockRes as express.Response,
      mockNext as express.NextFunction
    );

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "User created",
      userId: mockInsertedId,
    });
  });

  it("should return 500 if insertUser fails", async () => {
    const mockInsertedId = new Object();
    (userModel.insertUser as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.createUser(
      mockReq as express.Request,
      mockRes as express.Response,
      mockNext as express.NextFunction
    );

    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });
});

describe("deleteUserController", () => {
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
    mockReq = { params: { userId: new ObjectId().toString() } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return 204 on success", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (userModel.deleteUserById as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (postModel.deletePostsByUserId as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (commentModel.deleteCommentsByUserId as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.pullUserFromFriendsLists as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });

    await userController.deleteUser(
      mockReq as express.Request<{ userId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Deleted User with ID=${mockReq.params!.userId}`,
    });
  });

  it("should return next with 404 if deleteUserById fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (userModel.deleteUserById as jest.Mock).mockResolvedValue(null);

    await userController.deleteUser(
      mockReq as express.Request<{ userId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError(`Could not find User with ID=${mockReq.params!.userId}`, 404)
    );
  });

  it("should return next with 500 if deletePostsByUserId fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (userModel.deleteUserById as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (postModel.deletePostsByUserId as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.deleteUser(
      mockReq as express.Request<{ userId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });

  it("should return next with 500 if deleteCommentsByUserId fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (userModel.deleteUserById as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (postModel.deletePostsByUserId as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (commentModel.deleteCommentsByUserId as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.deleteUser(
      mockReq as express.Request<{ userId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });

  it("should return next with 500 if pullUserFromFriendsLists fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (userModel.deleteUserById as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (postModel.deletePostsByUserId as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (commentModel.deleteCommentsByUserId as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.pullUserFromFriendsLists as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.deleteUser(
      mockReq as express.Request<{ userId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(new ApiError("DB Error", 500));
  });
});
