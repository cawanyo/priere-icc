import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Instance Serveur (Pour envoyer les notifications depuis les Server Actions)
// On utilise un global pour éviter de créer trop d'instances en dev
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Instance Client (Pour écouter dans les composants React)
export const pusherClient = new PusherClient("5abfe231be75d00e32d7", {
  cluster: "eu",
});