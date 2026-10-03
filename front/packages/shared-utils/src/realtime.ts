/** Technical transport only. Each consuming module owns its subscription port. */
export type RealtimeEvent = { event: string; payload: unknown };
export type RealtimeAuthorization = { token?: string; auth?: string };
export type RealtimeOptions = {
  transport: string;
  url: string;
  key?: string;
  cluster?: string;
  authorize?: (topic: string, socketId?: string) => Promise<RealtimeAuthorization>;
};
export class BrowserRealtimeSubscriber {
  constructor(private readonly options: RealtimeOptions) {}
  subscribe(topic: string, receive: (event: RealtimeEvent) => void, events: readonly string[] = ["changed"]): () => void {
    let stopped = false;
    let close = () => {};
    let retry: ReturnType<typeof setTimeout> | undefined;
    const connect = async () => {
      if (stopped || this.options.transport === "none") return;
      try {
        if (this.options.transport === "mercure" && this.options.url) {
          const auth = topic.startsWith("private.") ? await this.options.authorize?.(topic) : undefined;
          if (stopped || (topic.startsWith("private.") && !auth?.token)) return;
          const url = new URL(this.options.url);
          url.searchParams.append("topic", topic);
          if (auth?.token) url.searchParams.set("authorization", auth.token);
          const source = new EventSource(url.toString());
          close = () => source.close();
          for (const event of events) source.addEventListener(event, (message) => {
            if (!stopped) { try { receive({event, payload: JSON.parse((message as MessageEvent).data)}); } catch { /* Ignore malformed delivery; API is authoritative. */ } }
          });
          source.onerror = () => { clearTimeout(retry); source.close(); if (!stopped) retry = setTimeout(() => void connect(), 10000); };
          // Renew short-lived private grants without keeping a stale authorization indefinitely.
          if (auth?.token) retry = setTimeout(() => { source.close(); void connect(); }, 240000);
        } else if (this.options.transport === "pusher" && this.options.key) {
          const socket = new WebSocket(`wss://ws-${this.options.cluster || "eu"}.pusher.com/app/${encodeURIComponent(this.options.key)}?protocol=7&client=nova-terra&version=1.0`);
          close = () => socket.close();
          socket.onmessage = async (message) => {
            try {
              const frame = JSON.parse(String(message.data));
              const data = typeof frame.data === "string" ? JSON.parse(frame.data) : frame.data;
              if (frame.event === "pusher:connection_established") {
                const auth = topic.startsWith("private.") ? await this.options.authorize?.(topic, data.socket_id) : undefined;
                if (stopped || socket.readyState !== WebSocket.OPEN || (topic.startsWith("private.") && !auth?.auth)) return;
                socket.send(JSON.stringify({event: "pusher:subscribe", data: {channel: topic.startsWith("private.") ? `private-${topic.slice(8)}` : topic, ...auth}}));
              } else if (frame.event === "pusher:ping") socket.send(JSON.stringify({event: "pusher:pong", data: {}}));
              else if (!stopped && events.includes(frame.event)) receive({event: frame.event, payload: data});
            } catch { /* Polling remains active after malformed or refused subscriptions. */ }
          };
          socket.onclose = () => { if (!stopped) retry = setTimeout(() => void connect(), 10000); };
        }
      } catch { if (!stopped) retry = setTimeout(() => void connect(), 10000); }
    };
    void connect();
    return () => { stopped = true; clearTimeout(retry); close(); };
  }
}
