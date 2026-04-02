import { SignJWT, jwtVerify } from "jose";

export type CollaborationRole = "owner" | "editor" | "viewer";

export interface CollaborationTokenPayload {
  documentId: string;
  role: CollaborationRole;
  sub: string;
}

const encoder = new TextEncoder();

function getSecret() {
  const secret =
    process.env.COLLABORATION_SECRET ||
    process.env.CLERK_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing COLLABORATION_SECRET or CLERK_SECRET_KEY");
  }

  return encoder.encode(secret);
}

export async function signCollaborationToken(payload: CollaborationTokenPayload) {
  return new SignJWT({
    documentId: payload.documentId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());
}

export async function verifyCollaborationToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());

  return {
    documentId: String(payload.documentId),
    role: payload.role as CollaborationRole,
    sub: String(payload.sub),
  };
}
