import { ResultsPage } from "@/components/results/results-page"

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  params?: Promise<{ [key: string]: string | undefined }>
}

export default async function AssessmentResultsPage(props: PageProps) {
  if (props.searchParams) await props.searchParams
  if (props.params) await props.params
  return <ResultsPage />
}
