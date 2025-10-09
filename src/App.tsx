import { useEffect, useRef, useState } from "react";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 100, 100);
  }, []);

  return (
    <>
      <header>Audio Placer</header>
      <main>
        <section>
          <button>add shape</button>
        </section>
        <section>
          <canvas
            ref={canvasRef}
            style={{ border: "1px solid black" }}
          ></canvas>
          <canvas></canvas>
        </section>
      </main>
    </>
  );
}

export default App;
