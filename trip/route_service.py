import requests
import polyline

API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMzOTU4Nzg0NDM3ODQ4YzFiOTU5MmI3MzI0MjVlMTlmIiwiaCI6Im11cm11cjY0In0="

def get_coordinates(place):
    url="https://nominatim.openstreetmap.org/search"
    params={"q":place,"format":"json","limit":1}

    res=requests.get(url,params=params,headers={"User-Agent":"app"})
    data=res.json()

    lat=float(data[0]["lat"])
    lon=float(data[0]["lon"])

    return [lon,lat]

def get_route(start,end):

    start_coords=get_coordinates(start)
    end_coords=get_coordinates(end)

    url="https://api.openrouteservice.org/v2/directions/driving-car"

    res=requests.post(url,json={"coordinates":[start_coords,end_coords]},
                     headers={"Authorization":API_KEY})

    data=res.json()

    route=data["routes"][0]

    distance_km=route["summary"]["distance"]/1000
    duration_hr=route["summary"]["duration"]/3600

    coords=polyline.decode(route["geometry"])

    return {
        "route":coords,
        "distance_km":distance_km,
        "duration_hr":duration_hr
    }