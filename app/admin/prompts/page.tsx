import { PromptLibraryView } from "@/components/admin/prompt-library-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Prompt library — Admin",
};

export default function AdminPromptLibraryPage() {
  return <PromptLibraryView />;
}
