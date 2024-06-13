import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) return; // 이미 연결 상태일 경우 재연결 생략
    const conn = await mongoose.connect(
      process.env.NEXT_PUBLIC_MONGODB_URL as string // env 타입 지정
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1); // 서버 연결 종료
  }
}
