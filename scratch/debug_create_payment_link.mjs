import https from "https";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

function callEdgeFunction(invoiceId) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/functions/v1/create-payment-link`;
    const bodyStr = JSON.stringify({ invoiceId });
    const u = new URL(url);
    
    const req = https.request(u, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

async function debug() {
  console.log("Testing create-payment-link with invoiceId 6cfcc2f5-ac1a-4578-a6ae-2af52d0f9d10...");
  const res = await callEdgeFunction("6cfcc2f5-ac1a-4578-a6ae-2af52d0f9d10");
  console.log("Status:", res.status);
  console.log("Body:", res.body);
}

debug();
