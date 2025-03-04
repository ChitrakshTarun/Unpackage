export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-16 row-start-2 items-center">
        <div className="flex flex-col gap-4 row-start-2 items-center">
          <h1 className="text-7xl font-medium">Unpackage</h1>
          <h1 className="text-2xl">Data Package Analyzer for that HUUUGE Zip of Account Data you received</h1>
        </div>
        <h1 className="text-4xl">Currently Building...</h1>
      </main>
    </div>
  );
}
