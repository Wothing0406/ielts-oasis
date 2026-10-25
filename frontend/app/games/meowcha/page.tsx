export default function MeowchaGamePage() {
  // The same-origin iframe reads the shared login storage. Never put bearer tokens
  // or the player's profile into URLs, access logs or referrer headers.
  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#05040a] z-50 p-0 m-0 border-none select-none">
      <iframe
        src="/meowcha/index.html?v=12.3"
        className="w-full h-full border-none block m-0 p-0 overflow-hidden"
        title="Meowcha IELTS Game"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        allow="autoplay; fullscreen"
        referrerPolicy="same-origin"
      />
    </main>
  );
}
