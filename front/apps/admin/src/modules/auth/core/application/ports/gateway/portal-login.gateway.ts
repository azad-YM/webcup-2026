export interface PortalLoginGateway {
  start(): Promise<string>
  complete(code: string, state: string): Promise<void>
}
