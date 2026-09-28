import ErpAppShell from "@/components/ErpAppShell";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ErpAppShell routeKey={`/employees/${id}/daily`} entityId={Number(id)} />;
}
