'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Deal, type Pipeline } from '../../../lib/api';

// Kanban board: deals grouped by stage. Moving a card calls
// POST /crm/deals/:id/stage, which emits deal.stage_changed and lands on the
// contact timeline (full auditability).
export default function BoardPage() {
  const qc = useQueryClient();
  const pipelines = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => api<Pipeline[]>('/crm/pipelines'),
    retry: false,
  });
  const deals = useQuery({
    queryKey: ['deals'],
    queryFn: () => api<Deal[]>('/crm/deals'),
    retry: false,
  });

  const moveDeal = useMutation({
    mutationFn: (vars: { dealId: string; stageId: string }) =>
      api(`/crm/deals/${vars.dealId}/stage`, { method: 'POST', json: { stageId: vars.stageId } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['deals'] }),
  });

  const pipeline = pipelines.data?.[0];

  if (pipelines.error || deals.error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="mt-4 text-sm text-amber-600">API not reachable. See docs/MANUAL_SETUP.md.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{pipeline?.name ?? 'Pipeline'}</h1>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {pipeline?.stages.map((stage) => {
          const stageDeals = deals.data?.filter((d) => d.stageId === stage.id) ?? [];
          return (
            <div key={stage.id} className="w-64 shrink-0 rounded-lg bg-zinc-50 p-3">
              <p className="mb-3 text-sm font-medium text-zinc-700">
                {stage.name} <span className="text-zinc-400">({stageDeals.length})</span>
              </p>
              <div className="flex flex-col gap-2">
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="rounded border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-medium">{deal.title}</p>
                    <p className="text-xs text-zinc-500">{deal.contact.name}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      ₹{Number(deal.value).toLocaleString('en-IN')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pipeline.stages
                        .filter((s) => s.id !== stage.id)
                        .map((s) => (
                          <button
                            key={s.id}
                            onClick={() => moveDeal.mutate({ dealId: deal.id, stageId: s.id })}
                            className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-200"
                          >
                            → {s.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {stageDeals.length === 0 && <p className="text-xs text-zinc-400">No deals</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
