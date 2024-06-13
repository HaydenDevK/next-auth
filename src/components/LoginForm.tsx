import { githubLogin, login } from "@/libs/action";

export default function LoginForm() {
  return (
    <>
      <form action={login}>
        <input type="text" name="email" placeholder="Enter Your Email" />
        <input
          type="password"
          name="password"
          placeholder="Enter Your Password"
        />
        <button>Login</button>
      </form>
      <form action={githubLogin}>
        <button>GitHub Login</button>
      </form>
    </>
  );
}
