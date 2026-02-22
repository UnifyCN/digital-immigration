import { PathwayDetail } from "@/components/pathways/PathwayDetail"

export default async function PathwayDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PathwayDetail slug={slug} />
}
