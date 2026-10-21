import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-block shrink-0 rounded", className)}>
      <Image
        src="/logo-assurbatisseurs.png"
        alt="AssurBâtisseurs — accueil"
        width={560}
        height={289}
        priority
        className="h-auto w-full"
      />
    </Link>
  );
}
