import type { CityNotice, AlertPreference } from "../../../domain/alert"
export interface AlertsGateway { alerts(): Promise<CityNotice[]>; notifications(): Promise<CityNotice[]>; preferences(): Promise<AlertPreference>; setConsent(healthConsent: boolean): Promise<void>; subscribe(onChange: () => void): () => void }
