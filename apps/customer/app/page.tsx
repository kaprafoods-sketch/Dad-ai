import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Nirmaanco</h1>
      <p className="text-lg text-zinc-600">
        Your AI Business Operating System — CRM, AI Receptionist, AI Employee, Document AI, and
        workflow automation, tailored to your industry.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Open dashboard
      </Link>
    </main>
  );
}
