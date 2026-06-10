import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function CounselorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?role=counselor&callbackUrl=/counselor/dashboard");
  }
  if (session.user.role !== "counselor") {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
