import express from "express";
import * as userController from "@App/user/user-controller";
import * as userModel from "@App/user/user-model";
import * as mongo from "@App/utils/mongo";
import * as postModel from "@App/post/post-model";
import * as commentModel from "@App/comment/comment-model";
import * as friendRequestModel from "@App/friend-request/friend-request-model";
import { ObjectId } from "mongodb";
import { ApiError } from "@App/utils/api-error";
import { SendFriendRequestRequest } from "../user.types";

jest.mock("@App/user/user-model");
jest.mock("@App/utils/mongo");
jest.mock("@App/post/post-model");
jest.mock("@App/comment/comment-model");
jest.mock("@App/friend-request/friend-request-model");

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

describe("sendFriendRequestController", () => {
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
      params: { userId: new ObjectId().toString() },
      body: {
        senderId: new ObjectId().toString(),
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return 201 on success", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    const mockInsertedId = new ObjectId();
    (friendRequestModel.insertFriendRequest as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: mockInsertedId,
    });
    (userModel.addFriendRequestToReceiver as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.addFriendRequestToSender as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });

    await userController.sendFriendRequest(
      mockReq as express.Request<
        { userId: string },
        {},
        SendFriendRequestRequest
      >,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Created new Friend Request with ID=${mockInsertedId}`,
    });
  });

  it("should return next with 500 if insertFriendRequest fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (friendRequestModel.insertFriendRequest as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.sendFriendRequest(
      mockReq as express.Request<
        { userId: string },
        {},
        SendFriendRequestRequest
      >,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError("Failed to insert Friend Request", 500)
    );
  });

  it("should return next with 500 if addFriendRequestToReceiver fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (friendRequestModel.insertFriendRequest as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.addFriendRequestToReceiver as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.sendFriendRequest(
      mockReq as express.Request<
        { userId: string },
        {},
        SendFriendRequestRequest
      >,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError("Failed to insert Friend Request", 500)
    );
  });

  it("should return next with 500 if addFriendRequestToSender fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (friendRequestModel.insertFriendRequest as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.addFriendRequestToReceiver as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.addFriendRequestToSender as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.sendFriendRequest(
      mockReq as express.Request<
        { userId: string },
        {},
        SendFriendRequestRequest
      >,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError("Failed to insert Friend Request", 500)
    );
  });
});

describe("cancelFriendRequestController", () => {
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: express.NextFunction;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockDeletedRequest = {
    recieverId: new ObjectId(),
    senderId: new ObjectId(),
  };

  beforeEach(() => {
    mockReq = {
      params: {
        requestId: new ObjectId().toString(),
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should return 201 on success", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (friendRequestModel.pullFriendRequest as jest.Mock).mockResolvedValue(
      mockDeletedRequest
    );
    (userModel.pullFriendRequestFromSender as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.pullFriendRequestFromReceiver as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });

    await userController.cancelFriendRequest(
      mockReq as express.Request<{ requestId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Successfully cancelled Friend Request",
    });
  });

  it("should return next with 500 if pullFriendRequest fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (friendRequestModel.pullFriendRequest as jest.Mock).mockResolvedValue(null);

    await userController.cancelFriendRequest(
      mockReq as express.Request<{ requestId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError("Failed to delete Friend Request", 500)
    );
  });

  it("should return next with 500 if pullFriendRequestFromSender fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (friendRequestModel.pullFriendRequest as jest.Mock).mockResolvedValue(
      mockDeletedRequest
    );
    (userModel.pullFriendRequestFromSender as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.cancelFriendRequest(
      mockReq as express.Request<{ requestId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError("Failed to delete Friend Request", 500)
    );
  });

  it("should return next with 500 if pullFriendRequestFromReceiver fails", async () => {
    (mongo.getClient as jest.Mock).mockReturnValue({
      startSession: () => mockSession,
    });
    (friendRequestModel.pullFriendRequest as jest.Mock).mockResolvedValue(
      mockDeletedRequest
    );
    (userModel.pullFriendRequestFromSender as jest.Mock).mockResolvedValue({
      acknowledged: true,
    });
    (userModel.pullFriendRequestFromReceiver as jest.Mock).mockResolvedValue({
      acknowledged: false,
    });

    await userController.cancelFriendRequest(
      mockReq as express.Request<{ requestId: string }>,
      mockRes as express.Response,
      mockNext
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new ApiError("Failed to delete Friend Request", 500)
    );
  });
});
