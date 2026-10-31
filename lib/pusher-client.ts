import PusherClient from "pusher-js";

// Singleton Pusher client instance for the browser
let clientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;

  if (!clientInstance) {
    clientInstance = new PusherClient("5abfe231be75d00e32d7", {
      cluster: "eu",
    });
  }

  return clientInstance;
}
