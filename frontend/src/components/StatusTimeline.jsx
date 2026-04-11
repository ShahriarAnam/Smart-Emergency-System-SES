function formatTimestamp(value) {
  if (!value) {
    return 'Not yet';
  }

  return new Date(value).toLocaleString();
}

function TimelineStep({ title, timestamp, done, color = 'green', hideLine = false }) {
  let dotClass = 'bg-slate-300';
  let textClass = 'text-slate-500';
  let lineClass = 'bg-slate-300';

  if (color === 'red') {
    dotClass = 'bg-rose-500';
    textClass = 'text-rose-700';
    lineClass = 'bg-rose-300';
  } else if (done) {
    dotClass = 'bg-emerald-500';
    textClass = 'text-emerald-700';
    lineClass = 'bg-emerald-300';
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className={`h-4 w-4 rounded-full ${dotClass}`} />
        {!hideLine ? <span className={`mt-1 h-12 w-0.5 ${lineClass}`} /> : null}
      </div>
      <div className="pb-3">
        <p className={`text-sm font-semibold ${textClass}`}>{title}</p>
        <p className="text-xs text-slate-500">{formatTimestamp(timestamp)}</p>
      </div>
    </div>
  );
}

export default function StatusTimeline({ createdAt, acceptedAt, completedAt, status }) {
  const normalizedStatus = String(status || '').toLowerCase();
  const acceptedDone = Boolean(acceptedAt) || ['accepted', 'completed'].includes(normalizedStatus);
  const completedDone = Boolean(completedAt) || normalizedStatus === 'completed';
  const isCancelled = normalizedStatus === 'cancelled';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Status Timeline</h3>

      <TimelineStep
        title="Request Created"
        timestamp={createdAt}
        done
      />

      <TimelineStep
        title="Accepted"
        timestamp={acceptedAt}
        done={acceptedDone}
      />

      <TimelineStep
        title="Completed"
        timestamp={completedAt}
        done={completedDone}
        hideLine={!isCancelled}
      />

      {isCancelled ? (
        <TimelineStep
          title="Cancelled"
          timestamp={completedAt || acceptedAt || createdAt}
          done
          color="red"
          hideLine
        />
      ) : null}
    </div>
  );
}
