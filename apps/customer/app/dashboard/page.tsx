// Placeholder dashboard. Phase 0 replaces this with the authed, pack-driven
// shell: terminology, nav, and widgets all render from the tenant's ui.json
// (docs/industry-packs.md).

const NAV = ['Dashboard', 'CRM', 'Inbox', 'Documents', 'Knowledge Base', 'Workflows', 'Agents'];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-zinc-200 p-4">
        <p className="mb-6 text-lg font-bold">Dad AI</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <span
              key={item}
              className="cursor-default rounded px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-zinc-600">
          Tenant provisioning, auth, and the pack-driven UI land in Phase 0–1. See docs/roadmap.md.
        </p>
      </main>
    </div>
  );
}
