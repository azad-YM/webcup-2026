import type { PortalLoginGateway } from "@/modules/auth/core/application/ports/gateway/portal-login.gateway"
import type { AuthGateway } from "@/modules/auth/core/application/ports/gateway/auth.gateway"
import type { AuthSessionGateway } from "@/modules/auth/core/application/ports/gateway/auth-session.gateway"
import type { PermissionGateway } from "@/modules/admin/core/application/ports/gateway/permission.gateway"
import type { RoleGateway } from "@/modules/admin/core/application/ports/gateway/role.gateway"
import type { MemberGateway } from "@/modules/admin/core/application/ports/gateway/member.gateway"
import type { WebcupFeedGateway } from "@/modules/pilotage/core/application/ports/gateway/webcup-feed.gateway"
import type { SeenRequestsGateway } from "@/modules/pilotage/core/application/ports/gateway/seen-requests.gateway"
import type { RequestQueueGateway } from "@/modules/requests/core/application/ports/gateway/request-queue.gateway"
import type { AgentDeskGateway } from "@/modules/requests/core/application/ports/gateway/agent-desk.gateway"
import type { RealtimeSubscriber } from "@/modules/shared/core/ports/realtime-subscriber"

import type { CitizenAccountsGateway } from "@/modules/citizen-accounts/core/application/ports/gateway/citizen-accounts.gateway"
import type { SecurityJournalGateway } from "@/modules/security/core/application/ports/gateway/security-journal.gateway"
import type { AuditJournalGateway } from "@/modules/audit/core/application/ports/gateway/audit-journal.gateway"
import type { ActivityDashboardGateway } from "@/modules/pilotage/core/application/ports/gateway/activity-dashboard.gateway"
import type { ContentGateway } from "@/modules/content/core/application/ports/gateway/content.gateway"

export type Dependencies = {
  citizenAccountsGateway: CitizenAccountsGateway
  securityJournalGateway: SecurityJournalGateway
  portalLoginGateway: PortalLoginGateway
  authGateway: AuthGateway
  authSessionGateway: AuthSessionGateway
  permissionGateway: PermissionGateway
  roleGateway: RoleGateway
  memberGateway: MemberGateway
  webcupFeedGateway: WebcupFeedGateway
  seenRequestsGateway: SeenRequestsGateway
  requestQueueGateway: RequestQueueGateway
  agentDeskGateway: AgentDeskGateway
  /** One SSE stream per tab, shared by the screens (ADR 004). */
  realtime: RealtimeSubscriber
  contentGateway: ContentGateway
  auditJournalGateway: AuditJournalGateway
  activityDashboardGateway: ActivityDashboardGateway
}
