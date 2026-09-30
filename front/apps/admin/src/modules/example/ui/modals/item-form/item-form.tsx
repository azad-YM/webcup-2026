import {
  Button,
  Controller,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@boilerplate/shared-ui/components"
import { useItemForm } from "./item-form.hook"

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  itemId?: string | null
  triggerLabel?: string
}

export const ItemForm = ({ open, setOpen, itemId, triggerLabel }: Props) => {
  const { form, isSubmitting, isEditing, onSubmit, submitError, submitLabel, title } = useItemForm({
    itemId,
    onClose: () => setOpen(false),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerLabel && (
        <DialogTrigger asChild>
          <Button type="button">{triggerLabel}</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Données fictives servant d’exemple de formulaire complet.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <FieldGroup className="grid gap-4 px-6">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="item-name">Nom</FieldLabel>
                  <Input {...field} id="item-name" autoComplete="off" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="item-description">Description</FieldLabel>
                  <Textarea {...field} id="item-description" rows={4} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {isEditing && (
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="item-status">Statut</FieldLabel>
                    <select
                      {...field}
                      id="item-status"
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-invalid={fieldState.invalid}
                    >
                      <option value="active">Actif</option>
                      <option value="archived">Archivé</option>
                    </select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
          </FieldGroup>

          <DialogFooter className="border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
