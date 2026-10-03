import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { MunicipalService } from "../../domain/municipal-service"
import { sortByMostRecent, type Publication } from "../../domain/publication"

export const listServices: UseCase<void, MunicipalService[]> = async (dependencies) =>
  dependencies.serviceCatalogGateway.listServices()

export const listPublications: UseCase<void, Publication[]> = async (dependencies) =>
  sortByMostRecent(await dependencies.publicationGateway.listPublications())
