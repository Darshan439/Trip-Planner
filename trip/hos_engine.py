# =====================
# NORMALIZE EVENTS
# =====================
def normalize(events):
    fixed = []
    current = 0

    for e in events:
        start = max(e["start"], current)
        end = max(start, e["end"])

        if start > current:
            fixed.append({
                "type": "off_duty",
                "start": current,
                "end": start,
                "location": "Rest"
            })

        fixed.append({
            "type": e["type"],
            "start": start,
            "end": end,
            "location": e.get("location", "Unknown")
        })

        current = end

    if current < 24 - 0.01:
        fixed.append({
            "type": "off_duty",
            "start": current,
            "end": 24,
            "location": "Rest"
        })

    return fixed


# =====================
# MAIN ENGINE (FINAL FIX)
# =====================
def simulate_trip(total_miles, cycle_used, route_coords):

    logs = []

    speed = 50
    remaining = float(total_miles)
    day = 1

    MAX_DAYS = 30

    while remaining > 1 and day <= MAX_DAYS:

        events = []
        time = 0

        drive_today = 0
        duty_today = 0
        since_break = 0

        # =====================
        # PICKUP (ONLY DAY 1)
        # =====================
        if day == 1:
            events.append({
                "type": "on_duty",
                "start": 0,
                "end": 1,
                "location": "Pickup"
            })
            time = 1
            duty_today += 1

        # =====================
        # DRIVING LOOP (CLEAN)
        # =====================
        while remaining > 1:

            # HOS LIMITS
            if drive_today >= 11 or duty_today >= 14:
                break

            # 30 MIN BREAK AFTER 8 HOURS
            if since_break >= 8:
                events.append({
                    "type": "off_duty",
                    "start": time,
                    "end": time + 0.5,
                    "location": "Break"
                })
                time += 0.5
                since_break = 0
                continue

            # 🔥 KEY FIX: NO SMALL BLOCKS
            drive_time = min(
                8 - since_break,          # until break needed
                11 - drive_today,         # max driving
                14 - duty_today,          # duty window
                remaining / speed         # remaining miles
            )

            if drive_time <= 0:
                break

            # DRIVING BLOCK (LONG)
            events.append({
                "type": "driving",
                "start": time,
                "end": time + drive_time,
                "location": "Route"
            })

            time += drive_time
            drive_today += drive_time
            duty_today += drive_time
            since_break += drive_time
            remaining -= drive_time * speed

            # 🔥 MINIMAL ON-DUTY (NOT EVERY TIME)
            if drive_today >= 5 and duty_today < 14:
                events.append({
                    "type": "on_duty",
                    "start": time,
                    "end": time + 0.5,
                    "location": "Fuel / Inspection"
                })
                time += 0.5
                duty_today += 0.5

        # =====================
        # DROPOFF
        # =====================
        if remaining <= 1:
            events.append({
                "type": "on_duty",
                "start": time,
                "end": time + 1,
                "location": "Dropoff"
            })
            time += 1

        # =====================
        # END OF DAY REST
        # =====================
        if time < 24:
            events.append({
                "type": "off_duty",
                "start": time,
                "end": 24,
                "location": "Rest"
            })

        # =====================
        # NORMALIZE
        # =====================
        events = normalize(events)

        logs.append({
            "day": day,
            "events": events
        })

        day += 1

    return logs