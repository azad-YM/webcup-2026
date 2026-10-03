import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@boilerplate/shared-ui/components"
import { difficultyLabel, waveKey, waveLabel, type WebcupRequest } from "../../../core/domain/webcup-feed"
import { TrackingCell } from "./tracking-cell"

type Props = {
  requests: WebcupRequest[]
  newCodes: Set<string>
  canEditTracking: boolean
}

export function RequestTable({ requests, newCodes, canEditTracking }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <Table>
        <caption className="sr-only">Demandes diffusées par l’API du concours, dans l’ordre de l’API</caption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Code</TableHead>
            <TableHead scope="col">Suivi de l’équipe</TableHead>
            <TableHead scope="col">Demandeur</TableHead>
            <TableHead scope="col">Difficulté</TableHead>
            <TableHead scope="col" className="text-right">XP</TableHead>
            <TableHead scope="col">Vague</TableHead>
            <TableHead scope="col">Groupe</TableHead>
            <TableHead scope="col">Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(request => {
            const isNew = newCodes.has(request.requestCode)
            return (
              <TableRow key={request.requestCode} className={isNew ? "bg-amber-50" : undefined}>
                <TableCell className="align-top font-mono font-medium">
                  <span className="flex flex-wrap items-center gap-1">
                    {request.requestCode}
                    {isNew && <Badge>Nouvelle</Badge>}
                    {request.isAiRequest && <Badge variant="outline">IA</Badge>}
                  </span>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <TrackingCell request={request} canEdit={canEditTracking} />
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <span className="block">{request.requesterName ?? "—"}</span>
                  {request.requesterType && <span className="block text-xs text-muted-foreground">{request.requesterType}</span>}
                </TableCell>
                <TableCell className="align-top">{difficultyLabel(request)}</TableCell>
                <TableCell className="align-top text-right tabular-nums">
                  <span className="block font-medium">{request.xpTotal}</span>
                  <span className="block text-xs text-muted-foreground">{request.xpBase} + {request.xpTimeBonus}</span>
                </TableCell>
                <TableCell className="align-top">
                  <span className="block">{waveLabel(waveKey(request))}</span>
                  {request.arrivalTime && <span className="block text-xs text-muted-foreground">H+{request.arrivalTime}</span>}
                </TableCell>
                <TableCell className="align-top whitespace-normal">{request.groupName ?? "—"}</TableCell>
                <TableCell className="min-w-72 align-top whitespace-pre-line">{request.messagePublic ?? "—"}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
