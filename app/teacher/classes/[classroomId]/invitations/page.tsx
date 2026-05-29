import { ClassroomInvitationsView } from "@/components/invitations/classroom-invitations-view";

export const metadata = {
  title: "Classroom invitations",
};

type Props = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassroomInvitationsPage({ params }: Props) {
  const { classroomId } = await params;
  return <ClassroomInvitationsView classroomId={classroomId} />;
}
