'use client';

/**
 * Enquiry form → Dad AI platform CRM (`POST /v1/crm/contacts`).
 *
 * LIMITATION (copy the proven shape from apps/customer/app/dashboard/crm/page.tsx):
 * the API's createContactSchema only accepts `type`, `name`, `phone`, `email`,
 * and `customFields`. Extra keys may be rejected by zod validation, so the
 * request body below sends ONLY { type: 'lead', name, email }. The remaining
 * form fields (business, website, service interest, message, budget/timeline)
 * are collected for the visitor's context only — they are intentionally NOT
 * sent to the API. If a richer lead schema ships later, extend this call then.
 */

import { useState } from 'react';
import { API_URL, DEV_TENANT_ID, SERVICE_INTEREST_OPTIONS } from '../lib/site-config';

type Status = 'idle' | 'sending' | 'success' | 'error';

const inputClass =
  'w-full rounded-lg border border-ink/20 bg-paper px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-ember';

export default function ContactForm() {
  const apiConfigured = Boolean(API_URL);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [business, setBusiness] = useState('');
  const [website, setWebsite] = useState('');
  const [service, setService] = useState<string>(SERVICE_INTEREST_OPTIONS[3]);
  const [message, setMessage] = useState('');
  const [budget, setBudget] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Please tell us your name.';
    if (!email.trim()) {
      next.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'That email address doesn’t look right.';
    }
    if (!message.trim()) next.message = 'Please describe your project or challenge.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || status === 'sending') return;

    if (!API_URL) {
      setStatus('error');
      setStatusMessage('Enquiry system not configured yet — email us instead.');
      return;
    }

    setStatus('sending');
    setStatusMessage('');

    try {
      const res = await fetch(`${API_URL}/v1/crm/contacts`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(DEV_TENANT_ID ? { 'x-tenant-id': DEV_TENANT_ID } : {}),
        },
        // Intentionally minimal — see the limitation note at the top of this file.
        body: JSON.stringify({ type: 'lead', name: name.trim(), email: email.trim() || undefined }),
      });

      if (!res.ok) {
        throw new Error(`The enquiry system returned ${res.status}. Please try again later.`);
      }
      setStatus('success');
      setStatusMessage('Thanks — your enquiry was received. We’ll get back to you shortly.');
      setName('');
      setEmail('');
      setBusiness('');
      setWebsite('');
      setMessage('');
      setBudget('');
      setErrors({});
    } catch (err) {
      setStatus('error');
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong while sending your enquiry. Please try again later.',
      );
    }
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} role="alert" className="mt-1.5 text-sm text-ember">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div>
      {!apiConfigured && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-marigold bg-marigold/15 px-5 py-4 text-sm leading-relaxed text-ink"
        >
          <p className="font-semibold">Enquiry system not configured yet — email us instead.</p>
          <p className="mt-1">
            The live enquiry backend isn&apos;t connected to this site yet, so this form won&apos;t
            send anything right now. Once it is, submissions will go straight into our CRM.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate aria-describedby="form-status">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="cf-name" className="mb-1.5 block text-sm font-semibold text-ink">
              Your name{' '}
              <span aria-hidden="true" className="text-ember">
                *
              </span>
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={inputClass}
            />
            {fieldError('name')}
          </div>

          <div>
            <label htmlFor="cf-email" className="mb-1.5 block text-sm font-semibold text-ink">
              Email{' '}
              <span aria-hidden="true" className="text-ember">
                *
              </span>
            </label>
            <input
              id="cf-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={inputClass}
            />
            {fieldError('email')}
          </div>

          <div>
            <label htmlFor="cf-business" className="mb-1.5 block text-sm font-semibold text-ink">
              Business / organisation <span className="font-normal text-ink/50">(optional)</span>
            </label>
            <input
              id="cf-business"
              name="business"
              type="text"
              autoComplete="organization"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="cf-website" className="mb-1.5 block text-sm font-semibold text-ink">
              Website <span className="font-normal text-ink/50">(optional)</span>
            </label>
            <input
              id="cf-website"
              name="website"
              type="url"
              autoComplete="url"
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="cf-service" className="mb-1.5 block text-sm font-semibold text-ink">
              Service interest
            </label>
            <select
              id="cf-service"
              name="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className={inputClass}
            >
              {SERVICE_INTEREST_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cf-budget" className="mb-1.5 block text-sm font-semibold text-ink">
              Budget / timeline <span className="font-normal text-ink/50">(optional)</span>
            </label>
            <input
              id="cf-budget"
              name="budget"
              type="text"
              placeholder="e.g. ₹50k, within 2 months"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="cf-message" className="mb-1.5 block text-sm font-semibold text-ink">
            Your project / challenge{' '}
            <span aria-hidden="true" className="text-ember">
              *
            </span>
          </label>
          <textarea
            id="cf-message"
            name="message"
            rows={5}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={`${inputClass} resize-y`}
          />
          {fieldError('message')}
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          className="mt-7 rounded-full bg-ember px-8 py-3.5 text-base font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Send enquiry'}
        </button>

        <div id="form-status" className="mt-4 min-h-[1.5rem]">
          {statusMessage && (
            <p
              role={status === 'error' ? 'alert' : 'status'}
              className={`text-sm font-medium ${status === 'error' ? 'text-ember' : 'text-green-700'}`}
            >
              {statusMessage}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
