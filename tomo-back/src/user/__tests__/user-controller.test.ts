import express from "express";
import * as userController from "@App/user/user-controller";
import * as userModel from "@App/user/user-model";
import { ObjectId } from "mongodb";
import { ApiError } from "@App/utils/api-error";

jest.mock("@App/user/user-model");

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
