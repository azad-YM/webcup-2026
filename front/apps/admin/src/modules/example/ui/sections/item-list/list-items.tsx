import { useState } from "react"
import { MoreHorizontalIcon } from "@boilerplate/shared-ui/components/icon"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@boilerplate/shared-ui/components"
import { itemStatusLabel } from "@/modules/example/core/domain/item"
import { ItemForm } from "../../modals/item-form/item-form"
import { useListItems } from "./list-items.hook"

export const ListItemsSection = () => {
  const { items, columns, isError, isLoading, errorMessage, deleteError, isDeleting, onDelete, retry } = useListItems()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleOpenEdit = (itemId: string) => {
    setSelectedId(itemId)
    setOpen(true)
  }

  return (
    <div className="rounded-2xl bg-white p-2 shadow-sm">
      {deleteError && <p role="alert" className="px-4 py-2 text-sm text-destructive">{deleteError}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.name}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} role="status">Chargement des éléments...</TableCell>
            </TableRow>
          )}

          {isError && !isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} role="alert">
                {errorMessage ?? "Impossible de charger les éléments."}
                <Button variant="link" onClick={retry}>Réessayer</Button>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && !items.length && (
            <TableRow>
              <TableCell colSpan={columns.length + 1}>Aucun élément pour le moment.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground">{item.description || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={item.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-700"}>
                  {itemStatusLabel(item.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8">
                      <MoreHorizontalIcon />
                      <span className="sr-only">Actions pour {item.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(item.id)}>Modifier</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void onDelete(item.id)} variant="destructive" disabled={isDeleting}>
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {open && selectedId && <ItemForm open={open} setOpen={setOpen} itemId={selectedId} />}
    </div>
  )
}
