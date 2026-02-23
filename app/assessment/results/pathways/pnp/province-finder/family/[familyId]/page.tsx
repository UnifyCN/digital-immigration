import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const FAMILY_META: Record<string, { title: string; description: string }> = {
  BC_EMPLOYER_SKILLED: {
    title: "BC Employer-Driven Skilled Worker",
    description:
      "This family focuses on BC employer-linked profiles, job-offer characteristics, and supporting work-history signals.",
  },
  BC_INTL_GRAD: {
    title: "BC International Graduate",
    description:
      "This family focuses on Canadian/BC education signals, recency, and supporting BC job-connection details.",
  },
}

export default async function ProvinceFinderFamilyDetailsPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const meta = FAMILY_META[familyId]
  if (!meta) return notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          <p className="text-xs text-muted-foreground">
            MVP note: This detail view is a family-level guide and not a final determination.
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/assessment/results/pathways/pnp/province-finder/results">
              Back to BC pathway recommendations
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
