import { formatEnvPresence, getSupabaseEnvPresence } from "@/lib/dev/local-debug";

type Props = {
  route: string;
  title?: string;
  errorMessage?: string;
  lessonId?: string;
  fetchSource?: string;
  extra?: Record<string, string | undefined>;
};

export function LocalDebugPanel({
  route,
  title = "Dev debug",
  errorMessage,
  lessonId,
  fetchSource,
  extra,
}: Props) {
  const env = formatEnvPresence(getSupabaseEnvPresence());

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-xs text-slate-800">
      <p className="font-semibold text-amber-900">{title}</p>
      <dl className="mt-2 space-y-1">
        <div>
          <dt className="inline font-medium">route: </dt>
          <dd className="inline break-all">{route}</dd>
        </div>
        {lessonId ? (
          <div>
            <dt className="inline font-medium">lessonId: </dt>
            <dd className="inline break-all">{lessonId}</dd>
          </div>
        ) : null}
        {fetchSource ? (
          <div>
            <dt className="inline font-medium">fetch source: </dt>
            <dd className="inline">{fetchSource}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-medium">NEXT_PUBLIC_SUPABASE_URL: </dt>
          <dd className="inline">{env.url}</dd>
        </div>
        <div>
          <dt className="inline font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY: </dt>
          <dd className="inline">{env.anonKey}</dd>
        </div>
        {errorMessage ? (
          <div>
            <dt className="font-medium">error: </dt>
            <dd className="mt-0.5 break-all whitespace-pre-wrap">{errorMessage}</dd>
          </div>
        ) : null}
        {extra
          ? Object.entries(extra).map(([key, value]) =>
              value ? (
                <div key={key}>
                  <dt className="inline font-medium">{key}: </dt>
                  <dd className="inline break-all">{value}</dd>
                </div>
              ) : null
            )
          : null}
      </dl>
    </div>
  );
}
