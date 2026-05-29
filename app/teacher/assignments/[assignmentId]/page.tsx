import { AssignmentDetailView } from "@/components/teacher/assignment-detail-view";

export const metadata = {
  title: "Assignment detail — Teacher",
  description: "Assignment details and student results.",
};

type Props = {
  params: Promise<{ assignmentId: string }>;
};

export default async function AssignmentDetailPage({ params }: Props) {
  const { assignmentId } = await params;
  return <AssignmentDetailView assignmentId={assignmentId} />;
}
