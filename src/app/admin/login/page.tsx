import { contarPasskeys, senhaPermitida } from "@/lib/admin-seguranca";
import { LoginAdmin } from "./LoginAdmin";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ revogado?: string }>;
}) {
  const { revogado } = await searchParams;
  const temPasskeys = (await contarPasskeys().catch(() => 0)) > 0;
  return (
    <LoginAdmin
      temPasskeys={temPasskeys}
      senhaLiberada={senhaPermitida(temPasskeys)}
      revogado={revogado === "1"}
    />
  );
}
