import { DashboardLivePage } from "@/components/dashboard/dashboard-live-page";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const forbidden = typeof params.forbidden === "string";

  let data = null;
  let loadError: string | null = null;

  try {
    data = await getDashboardData();
  } catch (error) {
    console.error("[infraos] dashboard load error", error);
    loadError = "Não foi possível carregar o dashboard agora. Revise a conexão com o banco e tente novamente.";
  }

  return <DashboardLivePage initialData={data} forbidden={forbidden} initialError={loadError} />;
}
