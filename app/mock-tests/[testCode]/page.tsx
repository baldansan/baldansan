import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ testCode: string }>;
};

export default async function MockTestCodeRedirect({ params }: Props) {
  const { testCode } = await params;
  redirect(`/test/${testCode}`);
}
