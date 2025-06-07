import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Square?: any;
  }
}

const SQUARE_APP_ID = "sandbox-sq0idb-WQkqJtRLCweiTBkuYcIQXA";
const LOCATION_ID = "LHJCQ86R6K6QR";

const TestPayment: React.FC = () => {
  const cardRef = useRef<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const loadSquareScript = async () => {
      if (window.Square) {
        await initSquare();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
      script.async = true;
      script.onload = initSquare;
      document.body.appendChild(script);
    };

    const initSquare = async () => {
      try {
        console.log("App ID:", SQUARE_APP_ID);

        const paymentsInstance = window.Square!.payments(SQUARE_APP_ID, LOCATION_ID);
        setPayments(paymentsInstance);

        const cardElement = await paymentsInstance.card();
        await cardElement.attach(cardRef.current);
        setCard(cardElement);
        setStatus("✅ Square ready");
      } catch (err) {
        setStatus("❌ Failed to initialize Square: " + (err as Error).message);
      }
    };

    loadSquareScript();
  }, []);

  const handlePayment = async () => {
    if (!card) return;

    setStatus("Creating payment token...");
    try {
      const result = await card.tokenize();
      if (result.status !== "OK") throw new Error("Tokenization failed");

      setStatus("Submitting to backend...");

      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          idempotencyKey: crypto.randomUUID(),
          amount: 799, // cents
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatus("✅ Payment successful!");
      } else {
        throw new Error(json.message || "Payment failed");
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 20, background: "#fff", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h2>💳 Test Premium Upgrade</h2>
      <div ref={cardRef} style={{ marginBottom: 16 }}></div>
      <button onClick={handlePayment} style={{ padding: "0.75rem 1.5rem", fontWeight: "bold", borderRadius: 6, backgroundColor: "#0070f3", color: "white", border: "none", cursor: "pointer" }}>
        Pay $7.99
      </button>
      <p style={{ marginTop: 12 }}>{status}</p>
    </div>
  );
};

export default TestPayment;