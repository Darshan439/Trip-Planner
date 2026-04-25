let allDays = [];
let currentDayIndex = 0;

document.getElementById("generateBtn").onclick = generatePlan;

async function generatePlan() {
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;

    const fromDisplay = document.getElementById("fromDisplay");
    const toDisplay   = document.getElementById("toDisplay");
    if (fromDisplay) fromDisplay.value = from;
    if (toDisplay)   toDisplay.value   = to;

    try {
        const res = await fetch("https://trip-planner-ormo.onrender.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start: from, end: to })
        });

        if (!res.ok) {
            const err = await res.json();
            alert("API Error: " + (err.error || res.status));
            return;
        }

        const data = await res.json();
        console.log("API Response:", data);

        allDays = data.trip_plan;
        currentDayIndex = 0;

        const milesEl = document.getElementById("totalMiles");
        if (milesEl && data.distance_miles) {
            milesEl.value = data.distance_miles + " mi";
        }

        render();

    } catch (e) {
        console.error("Fetch failed:", e);
        alert("Could not connect to backend. Is Django running on port 8000?");
    }
}

function render() {
    if (!allDays || allDays.length === 0) return;
    const day = allDays[currentDayIndex];
    document.getElementById("dayLabel").innerText = "Day " + day.day;
    console.log("Rendering Day", day.day, "Events:", day.events);
    drawELD(day.events);
    updateTotals(day.events);
    updateRemarks(day.events);
}

function nextDay() {
    if (currentDayIndex < allDays.length - 1) { currentDayIndex++; render(); }
}
function prevDay() {
    if (currentDayIndex > 0) { currentDayIndex--; render(); }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DRAW ELD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function drawELD(events) {
    const c   = document.getElementById("eldCanvas");
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    // â”€â”€ Layout constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const LEFT_W  = 110;
    const RIGHT_W = 70;
    const TOP_H   = 32;
    const ROW_H   = 44;
    const NUM_ROWS = 4;

    const gridX = LEFT_W;
    const gridY = TOP_H;
    const gridW = c.width - LEFT_W - RIGHT_W;
    const gridH = ROW_H * NUM_ROWS;

    // â”€â”€ Row order matches FMCSA paper log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const ROWS = [
        { key: "off_duty", label: ["1. Off Duty"],             idx: 0 },
        { key: "sleeper",  label: ["2. Sleeper", "Berth"],     idx: 1 },
        { key: "driving",  label: ["3. Driving"],              idx: 2 },
        { key: "on_duty",  label: ["4. On Duty","(Not Drv.)"], idx: 3 }
    ];
    const rowMap = {};
    ROWS.forEach(r => { rowMap[r.key] = r.idx; });

    const HOUR_LABELS = [
        "Mid-\nnight","1","2","3","4","5","6","7","8","9","10","11",
        "Noon",
        "1","2","3","4","5","6","7","8","9","10","11","Mid-\nnight"
    ];

    // helper functions
    const px = h   => gridX + (h / 24) * gridW;
    const py = key => gridY + (rowMap[key] ?? 0) * ROW_H + ROW_H / 2;

    // â”€â”€ 1. Top hour labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ctx.font = "8.5px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    for (let i = 0; i <= 24; i++) {
        const x = px(i);
        const lines = HOUR_LABELS[i].split("\n");
        if (lines.length === 2) {
            ctx.fillText(lines[0], x, gridY - 17);
            ctx.fillText(lines[1], x, gridY - 6);
        } else {
            ctx.fillText(lines[0], x, gridY - 9);
        }
    }

    // â”€â”€ 2. Bottom hour labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const botBase = gridY + gridH;
    for (let i = 0; i <= 24; i++) {
        const x = px(i);
        const lines = HOUR_LABELS[i].split("\n");
        if (lines.length === 2) {
            ctx.fillText(lines[0], x, botBase + 13);
            ctx.fillText(lines[1], x, botBase + 23);
        } else {
            ctx.fillText(lines[0], x, botBase + 17);
        }
    }

    // â”€â”€ 3. Outer border â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ctx.strokeStyle = "#000";
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(gridX, gridY, gridW, gridH);

    // â”€â”€ 4. Horizontal row dividers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ctx.strokeStyle = "#000";
    ctx.lineWidth   = 0.8;
    for (let i = 1; i < NUM_ROWS; i++) {
        const y = gridY + i * ROW_H;
        ctx.beginPath();
        ctx.moveTo(gridX, y);
        ctx.lineTo(gridX + gridW, y);
        ctx.stroke();
    }

    // â”€â”€ 5. Vertical hour lines + quarter-hour ticks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (let i = 0; i <= 24; i++) {
        const x = px(i);
        ctx.strokeStyle = (i === 0 || i === 24) ? "#000"
                        : i === 12              ? "#555"
                        :                         "#ccc";
        ctx.lineWidth   = (i === 0 || i === 24) ? 1.5 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x, gridY);
        ctx.lineTo(x, gridY + gridH);
        ctx.stroke();

        if (i < 24) {
            for (let q = 1; q <= 3; q++) {
                const qx    = px(i + q / 4);
                const tickH = q === 2 ? 9 : 5;
                ctx.strokeStyle = "#bbb";
                ctx.lineWidth   = 0.4;
                for (let r = 0; r < NUM_ROWS; r++) {
                    const ry = gridY + r * ROW_H;
                    ctx.beginPath(); ctx.moveTo(qx, ry);           ctx.lineTo(qx, ry + tickH);         ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(qx, ry + ROW_H);   ctx.lineTo(qx, ry + ROW_H - tickH); ctx.stroke();
                }
            }
        }
    }

    // â”€â”€ 6. Row labels (left) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ctx.fillStyle = "#000";
    ctx.textAlign = "right";
    ctx.font      = "10px Arial";
    ROWS.forEach(r => {
        const midY = gridY + r.idx * ROW_H + ROW_H / 2;
        if (r.label.length === 2) {
            ctx.fillText(r.label[0], gridX - 5, midY - 5);
            ctx.fillText(r.label[1], gridX - 5, midY + 7);
        } else {
            ctx.fillText(r.label[0], gridX - 5, midY + 4);
        }
    });

    // â”€â”€ 7. Right column â€” total hours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const rxStart = gridX + gridW;
    ctx.font      = "bold 8px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("TOTAL",  rxStart + RIGHT_W / 2, gridY + 13);
    ctx.fillText("HOURS",  rxStart + RIGHT_W / 2, gridY + 23);

    ctx.strokeStyle = "#000";
    ctx.lineWidth   = 0.8;
    ROWS.forEach(r => {
        ctx.strokeRect(rxStart, gridY + r.idx * ROW_H, RIGHT_W, ROW_H);
    });

    // â”€â”€ 8. ELD blue line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!events || events.length === 0) return;

    const sorted = [...events].sort((a, b) => a.start - b.start);

    ctx.strokeStyle = "#1a3fa3";
    ctx.lineWidth   = 2;
    ctx.lineJoin    = "miter";
    ctx.lineCap     = "square";

    // Determine the correct starting row:
    // Find what status is active at time=0
    // (the first event whose start <= 0 and end > 0, or just the first event)
    let startType = sorted[0].type;
    for (const e of sorted) {
        if (e.start <= 0 && e.end > 0) { startType = e.type; break; }
    }

    let curX = px(0);
    let curY = py(startType);

    sorted.forEach(e => {
        const x1 = px(e.start);
        const x2 = px(e.end);
        const y  = py(e.type);

        ctx.beginPath();
        ctx.moveTo(curX, curY);

        // Draw horizontal to this event's start (staying in current row)
        if (x1 > curX) {
            ctx.lineTo(x1, curY);
        }

        // Draw vertical to this event's row (if different)
        if (Math.abs(curY - y) > 0.5) {
            ctx.lineTo(x1, y);
        }

        // Draw horizontal for the duration of this event
        ctx.lineTo(x2, y);
        ctx.stroke();

        curX = x2;
        curY = y;
    });

    // Extend line to midnight (end of day)
    const endX = px(24);
    if (curX < endX - 1) {
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(endX, curY);
        ctx.stroke();
    }

    // â”€â”€ 9. Total hours values in right column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const totals = computeTotals(events);
    ctx.font      = "11px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ROWS.forEach(r => {
        const val  = totals[r.key] || 0;
        const midY = gridY + r.idx * ROW_H + ROW_H / 2 + 4;
        ctx.fillText(val.toFixed(2), rxStart + RIGHT_W / 2, midY);
    });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TOTALS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function computeTotals(events) {
    const t = { off_duty: 0, sleeper: 0, driving: 0, on_duty: 0 };
    (events || []).forEach(e => {
        if (e.type in t) {
            t[e.type] += Math.max(0, e.end - e.start);
        } else {
            console.warn("Unknown event type:", e.type, e);
        }
    });
    return t;
}

function updateTotals(events) {
    const t = computeTotals(events);
    document.getElementById("offTotal").innerText   = t.off_duty.toFixed(2);
    document.getElementById("sleepTotal").innerText = t.sleeper.toFixed(2);
    document.getElementById("driveTotal").innerText = t.driving.toFixed(2);
    document.getElementById("onTotal").innerText    = t.on_duty.toFixed(2);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REMARKS â€” formatted like FMCSA log
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function updateRemarks(events) {
    const sorted = [...events].sort((a, b) => a.start - b.start);
    let text = "";
    sorted.forEach(e => {
        const label = e.type.toUpperCase().replace(/_/g, " ").padEnd(20);
        text += `${format(e.start)} â€“ ${format(e.end)}   ${label}  ${e.location || "Unknown"}\n`;
    });
    document.getElementById("remarksBox").value = text;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function format(h) {
    const hr  = Math.floor(h);
    const min = Math.round((h % 1) * 60);
    return `${pad(hr)}:${pad(min)}`;
}
function pad(n) { return n.toString().padStart(2, "0"); }