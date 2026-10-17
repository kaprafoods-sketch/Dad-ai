'use client';

/**
 * Tap-to-talk demo (ravan.ai "Talk naturally"-style).
 *
 * Contract copied exactly from apps/customer/app/dashboard/inbox/page.tsx:
 *   POST /v1/conversations/webchat  { message, conversationId? }
 *   → { conversationId, reply }
 *
 * This is a LIVE DEMO of the AI Receptionist over the web — it uses browser
 * speech recognition + synthesis. It is NOT telephony, and no latency claims
 * are made: response time depends on the network and the API.
 */

import { useEffect, useRef, useState } from 'react';
import { API_URL, DEV_TENANT_ID } from '../lib/site-config';

/* Minimal Web Speech API typings (not in the TS DOM lib). */
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    [index: number]: { transcript: string };
  }>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

type State = 'idle' | 'listening' | 'sending' | 'speaking';

const LANGS = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'हिन्दी (India)' },
];

export default function TapToTalk() {
  const [lang, setLang] = useState('en-IN');
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [notice, setNotice] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [supported, setSupported] = useState(true);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const stateRef = useRef<State>('idle');
  stateRef.current = state;

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
    return () => {
      recRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function stopRecognition() {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }

  async function askReceptionist(message: string) {
    if (!API_URL) {
      setNotice('Live demo unavailable — API not configured.');
      setState('idle');
      return;
    }
    setState('sending');
    setNotice('');
    try {
      const res = await fetch(`${API_URL}/v1/conversations/webchat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(DEV_TENANT_ID ? { 'x-tenant-id': DEV_TENANT_ID } : {}),
        },
        body: JSON.stringify({ message, conversationId }),
      });
      if (!res.ok) {
        throw new Error(
          `The demo returned ${res.status}. The receptionist may need OPENROUTER_API_KEY or a seeded agent on the API.`,
        );
      }
      const data = (await res.json()) as { conversationId: string; reply: string };
      setConversationId(data.conversationId);
      setReply(data.reply);
      speak(data.reply);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'The demo request failed. Please try again.');
      setState('idle');
    }
  }

  function speak(text: string) {
    const synth = window.speechSynthesis;
    if (!synth) {
      setState('idle');
      return;
    }
    setState('speaking');
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.onend = () => {
      if (stateRef.current === 'speaking') setState('idle');
    };
    utter.onerror = () => {
      if (stateRef.current === 'speaking') setState('idle');
    };
    synth.speak(utter);
  }

  function toggleTalk() {
    if (state === 'speaking') {
      window.speechSynthesis?.cancel();
      setState('idle');
      return;
    }
    if (state === 'listening') {
      stopRecognition();
      return;
    }
    if (state === 'sending') return;

    if (!supported) {
      setNotice(
        'Speech recognition isn’t supported in this browser. Try Chrome or Edge on desktop.',
      );
      return;
    }
    if (!API_URL) {
      setNotice('Live demo unavailable — API not configured.');
      return;
    }

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    recRef.current = rec;

    let finalTranscript = '';
    setTranscript('');
    setReply('');
    setNotice('');
    setState('listening');

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (!r) continue;
        const text = r[0]?.transcript ?? '';
        if (r.isFinal) finalTranscript += text;
        else interim += text;
      }
      setTranscript(finalTranscript + interim);
    };

    rec.onerror = (e) => {
      setState('idle');
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setNotice('Microphone access was denied. Allow microphone access and try again.');
      } else if (e.error !== 'aborted') {
        setNotice(`Speech recognition failed (${e.error}). Try again.`);
      }
    };

    rec.onend = () => {
      recRef.current = null;
      const message = finalTranscript.trim();
      if (message) {
        void askReceptionist(message);
      } else {
        setState('idle');
      }
    };

    try {
      rec.start();
    } catch {
      setState('idle');
    }
  }

  const buttonLabel =
    state === 'listening'
      ? 'Listening — tap to stop'
      : state === 'sending'
        ? 'Thinking…'
        : state === 'speaking'
          ? 'Speaking — tap to stop'
          : 'Tap to talk';

  return (
    <div className="rounded-3xl border border-paper/15 bg-ink/60 p-6 text-paper sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-bold">
          Tap to talk{' '}
          <span className="ml-2 rounded-full bg-marigold/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-marigold">
            Live demo
          </span>
        </p>
        <div role="radiogroup" aria-label="Speech language" className="flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={lang === l.code}
              onClick={() => setLang(l.code)}
              disabled={state !== 'idle'}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                lang === l.code
                  ? 'bg-ember text-paper'
                  : 'border border-paper/30 text-paper/70 hover:text-paper'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-paper/60">
        Speak to our AI Receptionist in English or Hindi. This is a web demo of the same agent that
        can later answer WhatsApp, email, and web chat — not a phone call.
      </p>

      <div className="mt-6 flex items-center gap-5">
        <button
          type="button"
          onClick={toggleTalk}
          aria-label={buttonLabel}
          aria-pressed={state === 'listening'}
          className={`flex h-20 w-20 items-center justify-center rounded-full transition-transform hover:scale-105 ${
            state === 'listening' ? 'bg-ember text-paper' : 'bg-paper text-ink'
          } ${state === 'listening' ? 'animate-[tap-to-talk-pulse_1.6s_ease-in-out_infinite]' : ''}`}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <path d="M12 17v4M8 21h8" />
          </svg>
        </button>
        <p className="text-sm text-paper/70">{buttonLabel}</p>
      </div>

      {notice && (
        <p role="alert" className="mt-4 rounded-xl bg-marigold/15 px-4 py-3 text-sm text-marigold">
          {notice}
        </p>
      )}

      {(transcript || reply) && (
        <div className="mt-6 space-y-3">
          {transcript && (
            <div className="rounded-xl bg-paper/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-paper/50">
                You said
              </p>
              <p className="mt-1 text-sm leading-relaxed">{transcript}</p>
            </div>
          )}
          {reply && (
            <div className="rounded-xl bg-ember/15 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-marigold">
                Receptionist
              </p>
              <p className="mt-1 text-sm leading-relaxed">{reply}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
