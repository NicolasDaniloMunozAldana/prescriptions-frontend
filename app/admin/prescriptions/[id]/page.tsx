import PrescriptionDetailPage from '@/app/components/prescriptions/PrescriptionDetailPage';

export default async function AdminPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrescriptionDetailPage id={id} role="doctor" backHref="/admin/prescriptions" />;
}
