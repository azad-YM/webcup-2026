import Link from "next/link"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"

export default function NotFound() {
  return (
    <>
      <PageHeader trail={[{ label: "Page introuvable" }]} title="Page introuvable" lead="Cette adresse ne correspond à aucune page du portail de Nova Terra." />
      <PageBody narrow>
        <p><Link href="/" className="font-medium text-teal-800 underline">Revenir à l’accueil</Link></p>
      </PageBody>
    </>
  )
}
