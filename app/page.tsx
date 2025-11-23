export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Cloudflare Pages Test Deployment
        </h1>
        <p className="text-center text-lg mb-4">
          This is a test Next.js project deployed via GitHub Actions to Cloudflare Pages.
        </p>
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Deployment Status:</h2>
          <p className="text-green-600">âœ“ Successfully deployed!</p>
        </div>
      </div>
    </main>
  );
}
