type Props = {
  message: string;
};

export function AdminDevImportWarning({ message }: Props) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">Dev import preview</p>
      <p className="mt-1">{message}</p>
      <p className="mt-2 text-xs text-amber-800">
        Admin auth did not finish in time. Importer UI is shown for local testing only.
      </p>
    </div>
  );
}
