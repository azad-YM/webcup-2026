import { LogOut } from "@boilerplate/shared-ui/components/icon"
import { useNavigate } from "react-router"
import {
  Avatar,
  AvatarFallback,
  Button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Separator,
} from "@boilerplate/shared-ui/components"
import { useGetProfileQuery, useLogoutMutation } from "@/modules/auth/core/application/rtk-api/auth"

export function NavUser() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useGetProfileQuery()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const name = profile?.name ?? "Utilisateur"
  const email = profile?.email ?? ""
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await logout().unwrap()
    navigate("/login", { replace: true })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Ouvrir le menu utilisateur">
          <Avatar className="size-9">
            <AvatarFallback>{isLoading ? "…" : initials}</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <PopoverHeader className="px-2 py-2">
          <PopoverTitle className="truncate">{isLoading ? "Chargement..." : name}</PopoverTitle>
          <PopoverDescription className="truncate">{email}</PopoverDescription>
        </PopoverHeader>
        <Separator className="my-1" />
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          <LogOut />
          {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
