import { useRef, useState, type FormEvent } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useAddMemberMutation, useListRolesQuery } from "../../../core/application/rtk-api/access-management"
import { isInitialPasswordValid } from "../../../core/domain/member"
import { assignableRoles } from "./assignable-roles"

export function useMemberForm() {
  const roles = useListRolesQuery()
  const [addMember, creation] = useAddMemberMutation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [success, setSuccess] = useState("")
  const submitting = useRef(false)
  const availableRoles = assignableRoles(roles.currentData ?? [])
  const roleIds = selectedRoleIds.filter(id => availableRoles.some(role => role.id === id))
  const passwordValid = isInitialPasswordValid(password)
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && passwordValid && roleIds.length > 0 && !creation.isLoading

  const toggleRole = (id: string) => {
    setSuccess("")
    setSelectedRoleIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id])
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || submitting.current) return
    submitting.current = true
    setSuccess("")
    try {
      const memberName = name.trim()
      await addMember({ name: memberName, email, password, roleIds }).unwrap()
      setSuccess(`« ${memberName} » a été ajouté. Transmettez-lui son mot de passe initial par un canal sûr.`)
      setName("")
      setEmail("")
      setPassword("")
      setSelectedRoleIds([])
    } catch {
      // RTK Query keeps the error; the form keeps the user's input.
    } finally {
      submitting.current = false
    }
  }

  return {
    roles, creation, name, setName, email, setEmail, password, setPassword,
    passwordValid, availableRoles, selectedRoleIds: roleIds, toggleRole,
    canSubmit, onSubmit, success,
    rolesError: roles.error ? getErrorMessage(roles.error) : null,
    creationError: creation.error ? getErrorMessage(creation.error) : null,
  }
}
