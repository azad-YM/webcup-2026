export interface RealtimeSubscriber {
 subscribe(topic: string, receive: (event: {event: string; payload: unknown}) => void, events?: readonly string[]): () => void
}
