import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex flex-col text-center">
        <h1 className="text-5xl font-bold mb-6">YourPortfolioTracker</h1>
        <p className="text-xl mb-12 text-gray-300">
          The privacy-first portfolio tracker built just for you. Upload your financial documents and let AI extract the data instantly.
        </p>

        <Link
          href="/api/auth/signin"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300"
        >
          Sign In / Get Started
        </Link>
      </div>
    </main>
  );
}
