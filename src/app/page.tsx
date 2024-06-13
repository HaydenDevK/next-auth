import { getSession } from "@/libs/getSession";

export default async function Home() {
  const session = await getSession(); // libs/getSession 이어야 함
  console.log(session);

  return (
    <>
      <h1>Home Component</h1>
      {JSON.stringify(session, null, 2)}
    </>
  );
}
