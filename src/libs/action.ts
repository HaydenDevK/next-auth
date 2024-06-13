"use server";

import { redirect } from "next/navigation";
import { connectDB } from "./db";
import { User } from "./schema";
import { hash } from "bcryptjs";
import { signIn, signOut } from "@/auth";

// 회원가입
export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string; // 비밀번호는 유출 대비 해시로 암호화해야한다.

  if (!name || !email || !password) {
    console.log("필수 입력 값을 모두 입력 해주세요.");
    // throw new Error("필수 입력 값을 모두 입력 해주세요.")
  }

  connectDB();

  // 존재하는 회원인지 조회
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    console.log("이미 존재하는 회원입니다.");
  }

  // 없는 회원이면 DB 넣기
  const hashedPassword = await hash(String(password), 10);
  const user = new User({
    name,
    email,
    password: hashedPassword,
  });
  await user.save();
  redirect("/login");
}

// 로그인
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    console.log("필수 입력 값을 모두 입력 해주세요.");
    // throw new Error("필수 입력 값을 모두 입력 해주세요.")
    return;
  }

  try {
    // auth.js 연동
    // console.log("TRY:", email, password); // test
    await signIn("credentials", {
      redirect: false,
      callbackUrl: "/",
      email,
      password,
    }); // src/auth.ts 에서 가져와야 함 주의
  } catch (e) {
    console.error(e);
  }
  redirect("/"); // try 안에서 하면 에러남
}

export async function githubLogin() {
  await signIn("github", { callbackUrl: "/" });
}

export async function logout() {
  await signOut(); // auth 폴더에 있는거!
}
