import { LoadingCard } from "@/components/shared/ui";

export default function ProtectedLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <LoadingCard lines={3} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LoadingCard lines={8} />
        <LoadingCard lines={10} />
      </div>
    </div>
  );
}
