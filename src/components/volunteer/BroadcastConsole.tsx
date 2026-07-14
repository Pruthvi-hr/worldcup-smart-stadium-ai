import { memo, useCallback, useMemo, useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';

interface Broadcast {
  id: string;
  channel: string;
  message: string;
  time: string;
}

const SEED_BROADCASTS: Broadcast[] = [
  { id: 'b1', channel: 'All Gates', message: 'Increase turnstile throughput at Gate B. Redirect overflow to Gate C.', time: '17:50' },
  { id: 'b2', channel: 'Medical', message: 'Heat exhaustion response in Block 112 — clear path to First Aid L1.', time: '17:42' },
  { id: 'b3', channel: 'Concourse', message: 'Open secondary vendor at Trophy Bar to reduce queue.', time: '16:55' },
];

const CHANNELS = ['All Gates', 'Medical', 'Concourse', 'Fan Plaza', 'Transit'] as const;

/**
 * Volunteer broadcast / messaging console. Messages are kept in local state;
 * new broadcasts prepend to the feed. Inputs are fully labelled.
 */
function BroadcastConsoleBase() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(SEED_BROADCASTS);
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>('All Gates');
  const [message, setMessage] = useState('');

  const canSend = useMemo(() => message.trim().length > 0, [message]);

  const send = useCallback(() => {
    const text = message.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setBroadcasts((prev) => [
      { id: crypto.randomUUID(), channel, message: text, time: now },
      ...prev,
    ]);
    setMessage('');
  }, [channel, message]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        send();
      }
    },
    [send],
  );

  return (
    <SectionCard
      title="Broadcast Console"
      icon={<Megaphone className="h-4 w-4" />}
      action={<Badge tone="aqua" pulse>{broadcasts.length} sent</Badge>}
    >
      {/* Composer */}
      <div className="mb-4 space-y-3 rounded-xl border border-ink-800 bg-ink-950/40 p-4">
        <label htmlFor="broadcast-channel" className="block text-xs font-semibold uppercase tracking-wider text-ink-400">
          Channel
        </label>
        <select
          id="broadcast-channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value as (typeof CHANNELS)[number])}
          aria-label="Select broadcast channel"
          className="input-field cursor-pointer"
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label htmlFor="broadcast-message" className="block text-xs font-semibold uppercase tracking-wider text-ink-400">
          Message
        </label>
        <textarea
          id="broadcast-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          maxLength={240}
          placeholder="Type a broadcast to your crew… (Cmd/Ctrl+Enter to send)"
          aria-label="Broadcast message text"
          className="input-field resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-500" aria-live="polite">{message.length}/240</span>
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="btn-primary !py-2 text-sm"
            aria-label={`Send broadcast to ${channel} channel`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Broadcast
          </button>
        </div>
      </div>

      {/* Feed */}
      <ul className="space-y-2.5" aria-label="Recent broadcasts">
        {broadcasts.map((b) => (
          <li key={b.id} className="rounded-xl border border-ink-800 bg-ink-900/40 p-3">
            <div className="mb-1 flex items-center justify-between">
              <Badge tone="aqua">{b.channel}</Badge>
              <span className="text-xs text-ink-500">{b.time}</span>
            </div>
            <p className="text-sm text-ink-200">{b.message}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export const BroadcastConsole = memo(BroadcastConsoleBase);
