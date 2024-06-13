import { getSession } from "@/libs/getSession";
import { redirect } from "next/navigation";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/");

  return <>{children}</>;
}
