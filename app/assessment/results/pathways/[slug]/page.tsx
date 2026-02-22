import { use } from "react"
import { PathwayDetail } from "@/components/pathways/PathwayDetail"

export default function PathwayDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <PathwayDetail slug={slug} />
}
