import PusherServer from "pusher";

// Fallbacks nettoyés pour garantir la connexion même si le .env a des espaces ou guillemets
const appId = (process.env.PUSHER_APP_ID || "2094149").replace(/["'\s]/g, "");
const key = (process.env.PUSHER_KEY || "5abfe231be75d00e32d7").replace(/["'\s]/g, "");
const secret = (process.env.PUSHER_SECRET || "6d515f69c321475f521f").replace(/["'\s]/g, "");
const cluster = (process.env.PUSHER_CLUSTER || "eu").replace(/["'\s]/g, "");

export const pusherServer = new PusherServer({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});
