import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add logic here to look up the user from the credentials supplied
        // For demonstration, accept any username and map it to a user.
        if (credentials?.username) {
            const user = { id: credentials.username, name: credentials.username, email: `${credentials.username}@example.com` };
            return user;
        }

        return null;
      }
    })
  ],
  pages: {
    // signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
  }
});

export { handler as GET, handler as POST };
