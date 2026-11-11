import { ClassroomInvitationsView } from "@/components/invitations/classroom-invitations-view";

export const metadata = {
  title: "Ангийн урилгууд",
};

type Props = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassroomInvitationsPage({ params }: Props) {
  const { classroomId } = await params;
  return <ClassroomInvitationsView classroomId={classroomId} />;
}
