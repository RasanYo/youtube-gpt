/**
 * Health Check Component
 *
 * A simple health check page that displays application status.
 * This endpoint is used by monitoring tools and deployment platforms
 * to verify the application is running correctly.
 *
 * Features:
 * - No authentication required
 * - Returns application status, timestamp, and version
 * - JSON-formatted display for easy reading
 */

export default function Health() {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.0',
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-8 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold text-foreground">
          Health Check
        </h1>
        <pre className="overflow-auto rounded-md bg-muted p-4 text-sm text-muted-foreground">
          {JSON.stringify(healthData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
