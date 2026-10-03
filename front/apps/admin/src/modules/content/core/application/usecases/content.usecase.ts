import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { MunicipalService, Publication } from "../../domain/content"
export const listServices: UseCase<void, MunicipalService[]> = async (_d, _s, deps) => deps.contentGateway.services()
export const listPublications: UseCase<void, Publication[]> = async (_d, _s, deps) => deps.contentGateway.publications()
export const saveService: UseCase<MunicipalService, void> = async (_d, _s, deps, value) => deps.contentGateway.saveService(value)
export const savePublication: UseCase<Publication, void> = async (_d, _s, deps, value) => deps.contentGateway.savePublication(value)
