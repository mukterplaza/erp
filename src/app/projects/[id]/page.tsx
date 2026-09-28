import ErpAppShell from "@/components/ErpAppShell";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ErpAppShell routeKey={`/projects/${id}`} entityId={Number(id)} />;
}
