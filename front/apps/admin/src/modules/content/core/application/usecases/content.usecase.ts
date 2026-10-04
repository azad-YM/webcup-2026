import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { Alert, MunicipalService, PlainLanguageDraft, Publication, PublicationPlainLanguageRequest, ServiceAvailabilityChange, ServicePlainLanguageRequest } from "../../domain/content"

export const listServices: UseCase<void, MunicipalService[]> = async (_dispatch, _getState, deps) => deps.contentGateway.listServices()
export const saveService: UseCase<MunicipalService, MunicipalService> = async (_dispatch, _getState, deps, service) => deps.contentGateway.saveService(service)
export const setServiceAvailability: UseCase<ServiceAvailabilityChange, MunicipalService> = async (_dispatch, _getState, deps, change) => deps.contentGateway.setServiceAvailability(change)
export const listDistricts: UseCase<void, string[]> = async (_dispatch, _getState, deps) => deps.contentGateway.listDistricts()
export const listPublications: UseCase<void, Publication[]> = async (_dispatch, _getState, deps) => deps.contentGateway.listPublications()
export const savePublication: UseCase<Publication, Publication> = async (_dispatch, _getState, deps, publication) => deps.contentGateway.savePublication(publication)
export const listAlerts: UseCase<void, Alert[]> = async (_dispatch, _getState, deps) => deps.contentGateway.listAlerts()
export const saveAlert: UseCase<Alert, Alert> = async (_dispatch, _getState, deps, alert) => deps.contentGateway.saveAlert(alert)
export const suggestServicePlainLanguage: UseCase<ServicePlainLanguageRequest, PlainLanguageDraft> = async (_dispatch, _getState, deps, request) => deps.contentGateway.suggestServicePlainLanguage(request)
export const suggestPublicationPlainLanguage: UseCase<PublicationPlainLanguageRequest, PlainLanguageDraft> = async (_dispatch, _getState, deps, request) => deps.contentGateway.suggestPublicationPlainLanguage(request)
