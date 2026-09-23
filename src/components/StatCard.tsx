export default function StatCard({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="rounded-2xl border border-[#dde0d8] bg-white p-6">
      <p className="text-xs font-bold uppercase tracking-[.1em] text-[#7a8377]">{label}</p>
      <p className="font-display mt-3 text-4xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-[#618344]">{change}</p>
    </div>
  );
}
