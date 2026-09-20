export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;

  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-text">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold">Link detail</h1>
        <p className="mt-2 text-text-muted">
          Per-scan breakdown for link {linkId}. Device, country, and referrer
          charts go here.
        </p>
      </div>
    </main>
  );
}
