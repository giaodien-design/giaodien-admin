import { redirect } from 'next/navigation';

export default async function AppFlowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/apps/${id}`);
}
