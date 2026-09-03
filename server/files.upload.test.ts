/* Storage guard tests: uploads require a user and reject unsupported content before S3 is called. */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const sampleUser: AuthenticatedUser = {
  id: 7,
  openId: "storage-test-user",
  email: "storage@example.com",
  name: "Storage Test",
  loginMethod: "test",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("files.upload", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.files.upload({
      filename: "device.jpg",
      contentType: "image/jpeg",
      size: 4,
      purpose: "device-photo",
      dataUrl: "data:image/jpeg;base64,YWJjZA==",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unsupported file types before storage", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));

    await expect(caller.files.upload({
      filename: "device.txt",
      contentType: "text/plain",
      size: 4,
      purpose: "device-photo",
      dataUrl: "data:text/plain;base64,YWJjZA==",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
