import type { MunicipalService, Publication } from "../../../domain/content"
export interface ContentGateway { services(): Promise<MunicipalService[]>; publications(): Promise<Publication[]>; saveService(value: MunicipalService): Promise<void>; savePublication(value: Publication): Promise<void> }
