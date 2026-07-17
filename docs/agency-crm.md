# Agency CRM — Running as Tenant #0

The agency's own client management does **not** get a separate CRM. The agency is provisioned as the first tenant on the platform (**tenant #0**) with the `agency` industry pack, and uses the same universal CRM every other tenant gets. This is deliberate dogfooding: every rough edge the agency feels is a rough edge paying tenants would feel.

---

## What lives where

| Concern                                                               | Lives in                         | Why                                      |
| --------------------------------------------------------------------- | -------------------------------- | ---------------------------------------- |
| Prospecting, leads, demos, proposals                                  | **Tenant #0 CRM** (customer app) | It's sales — exactly what the CRM is for |
| Client relationship, notes, follow-ups, documents (contracts, briefs) | **Tenant #0 CRM**                | Unified timeline + Document AI           |
| Provisioning a client's tenant, plan changes, suspension              | **Admin panel**                  | Platform operations, not sales           |
| Subscriptions, invoices, AI cost per client                           | **Admin panel**                  | Billing/metering is platform data        |

Rule of thumb: _relationships in the CRM, operations in the admin panel._

---

## The `agency` pack (`templates/agency/`)

- **Contact type:** `client` (businesses buying Dad AI) — plus standard `lead`.
- **Pipeline:** `Lead → Demo → Proposal → Onboarding → Active Client` (stages seeded from `pipelines.json`).
- **Custom fields on Deal** (validated by the pack's zod schema):
  - `industryPack` — which vertical the client will run
  - `tenantId` — set once their tenant is provisioned; **this is the link between the sales record and the live tenant**
  - `mrr` — monthly recurring revenue for the deal
  - `onboardingStatus` — checklist state during Onboarding stage

## The Deal → Tenant link

When a deal reaches **Onboarding**:

1. Admin panel (or later, a workflow) provisions the client's tenant with the chosen industry pack.
2. The new `tenant.id` is written back to the deal's `customFields.tenantId`.
3. From then on, the admin panel can deep-link from the tenant record to the agency CRM deal (and vice versa), and platform events for that tenant (subscription activated, payment received) can be mirrored onto the deal's Activity timeline via a workflow.

When the deal is **Won**, the contact's type flips from `lead` to `client`.

---

## Dogfood milestones (from the roadmap)

- **Phase 1:** tenant #0 provisioned; all agency client tracking moves into Dad AI. No spreadsheets, no external CRM.
- **Phase 2:** the agency's own AI Receptionist answers inbound WhatsApp/email leads for Dad AI itself; AI Employee sends the founder a daily pipeline report.
- **Phase 3:** the first design partners are managed end-to-end (lead → demo → provisioned tenant → paying subscription) inside the product.
