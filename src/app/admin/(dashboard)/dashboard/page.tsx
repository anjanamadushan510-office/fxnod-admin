import Link from "next/link";
import {
  Activity, ArrowUpRight, Banknote, Boxes, Cpu, LifeBuoy,
  Newspaper, UserX, Users, Wallet, type LucideIcon,
} from "lucide-react";

const modules: { href: string; title: string; detail: string; icon: LucideIcon; group: string }[] = [
  { href: "/admin/activity", title: "User activity", detail: "Review account and platform events", icon: Activity, group: "Monitor" },
  { href: "/admin/users", title: "Users", detail: "Inspect accounts and access controls", icon: Users, group: "Monitor" },
  { href: "/admin/users/closed", title: "Closed accounts", detail: "Review closed user records", icon: UserX, group: "Monitor" },
  { href: "/admin/deposits", title: "Deposits", detail: "Review pending wallet deposits", icon: Wallet, group: "Money" },
  { href: "/admin/payouts", title: "Deriv payouts", detail: "Review payout records", icon: Banknote, group: "Money" },
  { href: "/admin/commerce", title: "Tools & memberships", detail: "Manage plans, offers and access", icon: Boxes, group: "Products" },
  { href: "/admin/subscriptions", title: "Legacy subscriptions", detail: "Review existing subscriptions", icon: Cpu, group: "Products" },
  { href: "/admin/tickets", title: "Support tickets", detail: "Respond to customer requests", icon: LifeBuoy, group: "Content & support" },
  { href: "/admin/blog", title: "Blog", detail: "Manage guides and articles", icon: Newspaper, group: "Content & support" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-navy">Operations overview</h1>
        <p className="mt-1 text-sm text-navy-3">Choose a workspace to review and manage FXNOD.</p>
      </header>
      {(["Monitor", "Money", "Products", "Content & support"] as const).map((group) => (
        <section key={group} aria-labelledby={`group-${group.replace(/\W+/g, "-")}`} className="space-y-3">
          <h2 id={`group-${group.replace(/\W+/g, "-")}`} className="text-xs font-semibold uppercase tracking-wider text-navy-3">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {modules.filter((module) => module.group === group).map(({ href, title, detail, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-navy"><Icon size={19} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-navy">{title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-navy-3">{detail}</span>
                </span>
                <ArrowUpRight size={16} className="shrink-0 text-navy-3 transition-colors group-hover:text-gold-3" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
