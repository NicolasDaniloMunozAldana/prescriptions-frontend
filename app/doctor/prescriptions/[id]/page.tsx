import PrescriptionDetailPage from '@/app/components/prescriptions/PrescriptionDetailPage';

export default async function DoctorPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrescriptionDetailPage id={id} role="doctor" />;
}
