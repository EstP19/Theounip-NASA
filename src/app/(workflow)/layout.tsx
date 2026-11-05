import { Workspace } from "@/components/workspace";
import { getSnapshot } from "@/lib/context";

export default function WorkflowLayout({ children }: { children: React.ReactNode }) {
  return <Workspace initialContext={getSnapshot()}>{children}</Workspace>;
}
