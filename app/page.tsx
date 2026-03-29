// app/page.tsx  AstroCool home page (Server Component)
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="flex h-full flex-col">
      <ChatWidget />
    </main>
  );
}
