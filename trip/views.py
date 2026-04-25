from rest_framework.decorators import api_view
from rest_framework.response import Response

from .route_service import get_route
from .hos_engine import simulate_trip


# =====================
# NORMALIZE EVENTS (CRITICAL FIX)
# =====================
# ADD location pass-through (IMPORTANT)

def normalize_trip(trip_plan):

    for day in trip_plan:
        for event in day.get("events", []):

            etype = event.get("type", "").lower()
            subtype = event.get("sub_type", "")

            if etype == "driving":
                event["type"] = "driving"

            elif etype == "off_duty":
                if subtype == "sleeper":
                    event["type"] = "sleeper"
                else:
                    event["type"] = "off_duty"

            else:
                event["type"] = "on_duty"

            #  KEEP LOCATION (IMPORTANT)
            event["location"] = event.get("location", "Unknown")

    return trip_plan

@api_view(['POST'])
def plan_trip(request):

    print("\n🚀 API HIT: /api/plan/")

    # =====================
    # INPUTS
    # =====================
    start = request.data.get("start")
    end = request.data.get("end")
    cycle_used = request.data.get("cycle_used", 0)

    print(f"📥 INPUT → Start: {start}, End: {end}, Cycle Used: {cycle_used}")

    # SAFE CONVERSION
    try:
        cycle_used = float(cycle_used)
    except:
        cycle_used = 0

    # VALIDATION
    if not start or not end:
        print(" Missing input")
        return Response({
            "error": "Start and End locations are required"
        }, status=400)

    # =====================
    # ROUTE CALCULATION
    # =====================
    try:
        print(" Fetching route...")

        route_data = get_route(start, end)

        distance_km = route_data["distance_km"]
        duration_hr = route_data["duration_hr"]
        distance_miles = round(distance_km * 0.621371, 2)

        print(f"✅ Route OK → {distance_km} km, {duration_hr} hr")

    except Exception as e:
        import traceback
        print("\n🔥 ROUTE ERROR 🔥")
        traceback.print_exc()

        return Response({
            "error": "Route calculation failed",
            "details": str(e)
        }, status=500)

    # =====================
    # HOS CALCULATION
    # =====================
    try:
        print("⏱️ Running HOS simulation...")

        trip_plan = simulate_trip(
            total_miles=distance_miles,
            cycle_used=cycle_used,
            route_coords=route_data.get("route", [])
        )

        print(f" HOS OK → Days generated: {len(trip_plan)}")

        # 🔥 APPLY NORMALIZATION HERE
        trip_plan = normalize_trip(trip_plan)

    except Exception as e:
        import traceback
        print("\n HOS ERROR ")
        traceback.print_exc()

        return Response({
            "error": "HOS calculation failed",
            "details": str(e)
        }, status=500)

    # =====================
    # FINAL RESPONSE
    # =====================
    print("🎉 SUCCESS: Sending response\n")

    return Response({
        "trip_plan": trip_plan,
        "route": route_data.get("route", []),
        "distance_km": distance_km,
        "distance_miles": distance_miles,
        "duration_hr": duration_hr
    })