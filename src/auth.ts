import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "./libs/db";
import { User } from "./libs/schema";
import { compare } from "bcryptjs"; // 암호화된 것과 생 password를 비교해준다
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 로그인이 성공하면 여기로 들어온다?
        const { email, password } = credentials;
        if (!email || !password) {
          throw new CredentialsSignin("입력 값이 부족합니다.");
        }

        // 몽고디비 조회
        connectDB();
        const user = await User.findOne({ email }).select("+password +role"); // password, role은 빼먹지말고 가져와라
        if (!user) {
          throw new CredentialsSignin("유저가 존재하지 않습니다.");
        }

        // 사용자가 입력한 비번과 데이터 상의 비번이 동일한지 체크 (해시)
        const isMatched = await compare(String(password), user.password);
        if (!isMatched) {
          throw new CredentialsSignin("비밀번호가 일치하지 않습니다.");
        }

        // 유효한 사용자에게 유저 정보 리턴
        return {
          name: user.name,
          email: user.email,
          role: user.role, // auth.js 에서 정해높은 약속된 key 값이 있는데, role과 id는 없기 때문에 별도로 추가해줘야 한다. 아래의 callback 속성으로
          id: user._id, // 몽고디비 상의 Object 어쩌구 id
        };
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // 크리덴셜도 깃허브도 성공하면 여기로 가는데, 크리덴셜에 있는 값이 깃허브에는 없다!
    signIn: async ({ user, account }: { user: any; account: any }) => {
      console.log("signIn", user, account); // 여기엔 크리덴셜의 user.id, user.role 값 존재하므로 아래의 jwt에서 드리블해주도록 한다
      // if (account?.provider === "github") {
      //   const { id, email } = user; // 깃허브가 주는 유저 id로 몽고디비에서 존재하는지 조회 (몽고디비 기준 authProviderId 값으로 조회)
      //   await connectDB();
      //   const existingUser = await User.findOne({ authProviderId: "github" });
      //   if (!existingUser) {
      //     // 없으면 DB에 추가
      //     await new User({
      //       name: user.name,
      //       email: user.email,
      //       authProviderId: "github",
      //       role: "user",
      //     }).save();
      //   }

      //   // 있으면 정보 가져오기
      //   const githubUser = await User.findOne({ authProviderId: "github" });
      //   user.role = githubUser.role || "user"; // 깃허브에 없는 타입이라
      //   user.id = githubUser._id || null;
      //   return true; // 깃허브 로그인 통과!
      // } else {
      //   return true; // 크레덴셜 로그인 통과!
      // }

      // github id 중복 이슈
      if (account?.provider === "github") {
        const { name, email } = user;
        await connectDB(); // mongodb 연결
        const existingUser = await User.findOne({
          email,
          authProviderId: "github",
        });
        if (!existingUser) {
          // 소셜 가입
          await new User({
            name,
            email,
            authProviderId: "github",
            role: "user",
          }).save();
        }
        const socialUser = await User.findOne({
          email,
          authProviderId: "github",
        });
        user.role = socialUser?.role || "user";
        user.id = socialUser?._id || null;
        return true;
      } else {
        // 크레덴셜 통과
        return true;
      }
    },
    async jwt({ token, user }: { token: any; user: any }) {
      console.log("jwt", token, user); // 내부적으로 몇 번의 callback을 스스로 부르는데 값이 매번 다르다. 그 중 user가 있을 때를 캐치해야 한다.
      if (user) {
        // JWT 토큰에 추가
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token?.role) {
        // token에서 뽑아서 session에 추가
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
});
