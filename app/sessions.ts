import { createCookieSessionStorage } from "@remix-run/node";

// Small Note: It's 2am here and i don't wanna spend time fiddling around postgres hence using cookie based session storage.
const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "order_session",
      secrets: ["kaali maserati"],
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // aka 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };
