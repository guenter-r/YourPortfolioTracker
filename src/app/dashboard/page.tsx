import Upload from "@/components/Upload";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session || !session.user) {
      redirect("/api/auth/signin");
  }

  // Ensure user exists in DB to relate items to
  let dbUser = await prisma.user.findFirst({
      where: { username: session.user.name || "default" }
  });

  if (!dbUser) {
      dbUser = await prisma.user.create({
          data: {
              username: session.user.name || "default",
              password: "hashed_password" // dummy password for credential provider
          }
      });
  }

  const items = await prisma.portfolioItem.findMany({
    where: {
      userId: dbUser.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto p-8 text-black">
      <div className="flex justify-between items-center mb-8 text-white">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm">Logged in as {session.user.name || session.user.email}</div>
      </div>

      <div className="mb-12">
        <Upload />
      </div>

      <h2 className="text-2xl font-bold mb-4 text-white">Your Documents</h2>
      {items.length === 0 ? (
        <p className="text-gray-400 bg-gray-800 p-6 rounded-lg text-center">No portfolio items found. Upload one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            let data = {};
            try {
               data = JSON.parse(item.extractedData);
            } catch {
               console.error("Failed to parse", item.extractedData);
            }

            return (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
                <div className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-60">
                   <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
