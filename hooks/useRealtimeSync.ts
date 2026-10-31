"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import supabase from "@/lib/superbase";

interface UseRealtimeSyncOptions {
  channel: string;
  event?: string;
  onUpdate: (payload?: any) => void;
  debounceMs?: number;
}

/**
 * Hook pour synchroniser un composant React en temps réel.
 * Écoute à la fois via Pusher WebSocket et Supabase Realtime Broadcast.
 * Évite les doubles rafraîchissements grâce à un debounce intelligent.
 */
export function useRealtimeSync({
  channel: channelName,
  event: eventName,
  onUpdate,
  debounceMs = 300,
}: UseRealtimeSyncOptions) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const lastTriggerRef = useRef<number>(0);

  const triggerUpdate = (payload?: any) => {
    const now = Date.now();
    if (now - lastTriggerRef.current > debounceMs) {
      lastTriggerRef.current = now;
      onUpdateRef.current(payload);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Abonnement Pusher (ultra rapide et direct)
    const pusher = getPusherClient();
    let pusherChannel: any = null;

    if (pusher) {
      pusherChannel = pusher.subscribe(channelName);

      const handlePusherEvent = (data: any) => {
        triggerUpdate(data);
      };

      if (eventName) {
        pusherChannel.bind(eventName, handlePusherEvent);
      } else {
        // Si aucun événement spécifique n'est demandé, écoute les événements usuels
        pusherChannel.bind("update", handlePusherEvent);
        pusherChannel.bind("change", handlePusherEvent);
        pusherChannel.bind("slot-updated", handlePusherEvent);
        pusherChannel.bind("theme-updated", handlePusherEvent);
        pusherChannel.bind("assignment-updated", handlePusherEvent);
        pusherChannel.bind("member-updated", handlePusherEvent);
      }
    }

    // 2. Abonnement Supabase Realtime Broadcast (redondance haute disponibilité)
    const supabaseChannel = supabase.channel(`sync-${channelName}-${Math.random().toString(36).slice(2, 7)}`);

    supabaseChannel
      .on(
        "broadcast",
        { event: eventName || "*" },
        (payload: any) => {
          triggerUpdate(payload);
        }
      )
      .subscribe();

    // Nettoyage au démontage
    return () => {
      if (pusher && pusherChannel) {
        if (eventName) {
          pusherChannel.unbind(eventName);
        } else {
          pusherChannel.unbind_all();
        }
        pusher.unsubscribe(channelName);
      }

      supabase.removeChannel(supabaseChannel);
    };
  }, [channelName, eventName, debounceMs]);
}
