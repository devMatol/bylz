import https from "https";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";

function testWebhook() {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/functions/v1/stripe-webhook`;
    const u = new URL(url);
    
    const req = https.request(u, {
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "POST",
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("Testing stripe-webhook endpoint...");
  const res = await testWebhook();
  console.log("Status:", res.status);
  console.log("Body:", res.body);
}

run();
