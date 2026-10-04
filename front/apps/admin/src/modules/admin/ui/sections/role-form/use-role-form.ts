import { useRef, useState, type FormEvent } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useProtectedSubmit } from "@boilerplate/shared-ui/components/a11y"
import { useCreateRoleMutation, useListPermissionsQuery } from "../../../core/application/rtk-api/access-management"
import { permissionKey } from "../../../core/domain/permission"
import { filterPermissions, permissionContexts } from "./permission-options"

export function useRoleForm() {
  const catalog = useListPermissionsQuery("admin")
  const [createRole, creation] = useCreateRoleMutation()
  const [name, setName] = useState("")
  const [search, setSearch] = useState("")
  const [context, setContext] = useState("")
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [success, setSuccess] = useState("")
  const submitting = useRef(false)
  // F82 (L25) : un double envoi ne crée pas deux rôles (clé d’idempotence).
  const guard = useProtectedSubmit({})
  const permissions = catalog.currentData ?? []
  const selectedPermissions = permissions.filter(permission => selectedKeys.includes(permissionKey(permission)))
  const canSubmit = name.trim().length > 0 && catalog.isSuccess && !catalog.isFetching && !creation.isLoading && permissions.length > 0

  const togglePermission = (key: string) => {
    setSuccess("")
    setSelectedKeys(keys => keys.includes(key) ? keys.filter(value => value !== key) : [...keys, key])
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || submitting.current) return
    submitting.current = true
    setSuccess("")
    try {
      const roleName = name.trim()
      const payload = { name: roleName, permissions: selectedPermissions }
      await guard.submit(payload, () => createRole(payload).unwrap())
      setSuccess(`Le rôle « ${roleName} » a été créé.`)
      setName("")
      setSelectedKeys([])
      setSearch("")
      setContext("")
    } catch {
      // RTK Query retains the error and the form keeps the user's input.
    } finally {
      submitting.current = false
    }
  }

  return {
    catalog, creation, name, setName, search, setSearch, context, setContext,
    contexts: permissionContexts(permissions),
    permissions, visiblePermissions: filterPermissions(permissions, search, context),
    selectedKeys, selectedCount: selectedPermissions.length, togglePermission,
    canSubmit, onSubmit, success,
    catalogError: catalog.error ? getErrorMessage(catalog.error) : null,
    creationError: creation.error ? getErrorMessage(creation.error) : null,
  }
}
