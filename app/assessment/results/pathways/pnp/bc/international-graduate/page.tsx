import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BCInternationalGraduateDetailsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>BC International Graduate</CardTitle>
          <p className="text-sm text-muted-foreground">
            This family is typically explored when Canadian education details and BC ties are present.
          </p>
          <p className="text-xs text-muted-foreground">
            MVP note: this page is a family-level guide for exploration and not a final determination.
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
