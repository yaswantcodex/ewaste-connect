/* Full-stack storage tests: verify the typed contract without uploading fixture bytes to production storage. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { storagePutMock, createEwastePostMock } = vi.hoisted(() => ({
  storagePutMock: vi.fn(),
  createEwastePostMock: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: storagePutMock }));
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createEwastePost: createEwastePostMock };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const sampleUser: AuthenticatedUser = {
  id: 9,
  openId: "post-storage-user",
  email: "posts@example.com",
  name: "Post Storage User",
  loginMethod: "test",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext(): TrpcContext {
  return {
    user: sampleUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("posts and storage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storagePutMock.mockResolvedValue({ key: "users/9/device-photo/abc-device.jpg", url: "/manus-storage/users/9/device-photo/abc-device.jpg" });
    createEwastePostMock.mockResolvedValue({
      id: 42,
      ownerId: sampleUser.id,
      deviceType: "laptop",
      title: "Laptop ready for a new route",
      details: "Battery is tired but the screen still works.",
      status: "open",
      photoKey: "users/9/device-photo/abc-device.jpg",
      photoUrl: "/manus-storage/users/9/device-photo/abc-device.jpg",
      photoName: "device.jpg",
      photoMimeType: "image/jpeg",
      photoSize: 4,
      collectionEvidenceKey: null,
      collectionEvidenceUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("uploads an authenticated device photo and returns its storage reference", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.files.upload({
      filename: "device.jpg",
      contentType: "image/jpeg",
      size: 4,
      purpose: "device-photo",
      dataUrl: "data:image/jpeg;base64,YWJjZA==        ",
    });

    expect(storagePutMock).toHaveBeenCalledWith(expect.stringContaining("users/9/device-photo/"), expect.any(Buffer), "image/jpeg");
    expect(result).toMatchObject({ key: "users/9/device-photo/abc-device.jpg", url: "/manus-storage/users/9/device-photo/abc-device.jpg", size: 4, purpose: "device-photo" });
  });

  it("persists the stored file metadata on a new authenticated post", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.posts.create({
      deviceType: "laptop",
      title: "Laptop ready for a new route",
      details: "Battery is tired but the screen still works.",
      photo: { key: "users/9/device-photo/abc-device.jpg", url: "/manus-storage/users/9/device-photo/abc-device.jpg", name: "device.jpg", mimeType: "image/jpeg", size: 4 },
    });

    expect(createEwastePostMock).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 9, deviceType: "laptop", photoKey: "users/9/device-photo/abc-device.jpg", photoUrl: "/manus-storage/users/9/device-photo/abc-device.jpg", photoSize: 4 }));
    expect(result).toMatchObject({ id: 42, status: "open", photoKey: "users/9/device-photo/abc-device.jpg" });
  });
});
