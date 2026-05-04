const fetch = require('node-fetch');

async function testML() {
  const payload = {
    user_id: "test",
    typing_speed: 15,
    key_hold_avg_ms: 100,
    key_flight_avg_ms: 100,
    mouse_velocity: 1500,
    scroll_speed: 1000,
    idle_time_s: 0,
    click_deviation_px: 10,
    baseline: null
  };

  try {
    const res = await fetch('http://localhost:8001/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

testML();
