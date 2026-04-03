import { LoadingCard } from "@/components/shared/ui";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">
        <LoadingCard lines={6} />
      </div>
    </div>
  );
}
