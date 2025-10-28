import { getCurrentUser, getUserHistory } from "@/(app)/actions";
import InlineSparkline from "../components/InlineSparkline";
import SafeImage from "../components/SafeImage";
import Link from "next/link";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="p-4">
        <p className="mb-4">You need to login to see your history.</p>
        <Link
          href="/app/login"
          className="rounded-full no-underline font-medium py-2 px-6 bg-primary text-background"
        >
          Login
        </Link>
      </div>
    );
  }

  const history = await getUserHistory();
  const ratings = (history || [])
    .map((h) => h.product?.rated || 0)
    .slice(0, 20)
    .reverse();

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Your scan history</h1>
      {/* <div className="border p-3" style={{ borderColor: "var(--background-3)" }}>
        <p className="text-sm text-text-2 mb-2">Recent product ratings</p>
        <InlineSparkline values={ratings} />
      </div> */}
      {(!history || history.length === 0) && <p>No scans yet.</p>}
      {history &&
        history.map((h) => (
          <Link
            key={h.id}
            href={`/app/product/${h.product.barcode}`}
            className="flex items-center gap-3 border rounded p-3 no-underline"
          >
            <SafeImage
              src={h.product.image || "/no-image.webp"}
              alt={h.product.name}
              width={64}
              height={64}
              className="rounded"
            />
            <div className="flex-1">
              <p className="font-medium">{h.product.name}</p>
              <p className="text-sm text-text-3">
                {new Date(h.createdAt).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
    </div>
  );
}
