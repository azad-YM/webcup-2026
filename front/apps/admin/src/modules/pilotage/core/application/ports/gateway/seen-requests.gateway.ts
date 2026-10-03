/** Request codes already shown to this browser; `null` before the first visit. */
export interface SeenRequestsGateway {
  read(): Promise<string[] | null>
  write(codes: string[]): Promise<void>
}
