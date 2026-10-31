import { pusherServer } from "./pusher-server";
import supabase from "./superbase";

/**
 * Diffuse un événement temps réel de manière asynchrone et résiliente.
 * Envoie simultanément sur Pusher et Supabase Realtime Broadcast.
 */
export async function broadcastRealtime(
  channel: string,
  event: string,
  payload: Record<string, any> = {}
): Promise<void> {
  const timestamp = new Date().toISOString();
  const data = { ...payload, timestamp };

  // 1. Pusher Server Trigger
  const pusherPromise = (async () => {
    try {
      await pusherServer.trigger(channel, event, data);
    } catch (err) {
      console.warn(`[Realtime] Échec broadcast Pusher (${channel}/${event}):`, err);
    }
  })();

  // 2. Supabase Realtime Broadcast
  const supabasePromise = (async () => {
    try {
      const ch = supabase.channel(channel);
      await ch.send({
        type: "broadcast",
        event,
        payload: data,
      });
    } catch (err) {
      console.warn(`[Realtime] Échec broadcast Supabase (${channel}/${event}):`, err);
    }
  })();

  // On attend les deux sans bloquer si l'un échoue
  await Promise.allSettled([pusherPromise, supabasePromise]);
}
