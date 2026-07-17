// Placeholder admin shell. Phase 1 delivers tenant management, subscriptions,
// and the per-tenant AI cost dashboard (docs/roadmap.md).

const SECTIONS = [
  { name: 'Tenants', desc: 'Provision, pack, suspend — link to agency CRM deals' },
  { name: 'Subscriptions', desc: 'Plans, billing status, Razorpay events' },
  { name: 'AI Costs', desc: 'Per tenant / model / feature, to the cent' },
  { name: 'Agent Monitoring', desc: 'Error rates, handoff rates, prompt logs' },
  { name: 'System Health', desc: 'Queues, workers, connector sync status' },
];

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold">Dad AI Admin</h1>
      <p className="mt-1 text-zinc-600">
        Platform operations. Client relationships live in the agency CRM (tenant #0).
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <div key={s.name} className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-medium">{s.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
