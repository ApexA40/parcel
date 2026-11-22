# Backend handoff: delivery locations, rider tracking and frontend fixes

This document lists everything the frontend on branch `claude/wonderful-euler-xq7xir` now sends to or expects from the backend (the Shortly API, `/shortly`). It was written against the API description at `/shortly/v3/api-docs`.

Items are grouped by priority:

- **Part A** is required: without it, the new delivery-location features save nothing and show nothing.
- **Part B** is about access and request volume for the rider map pages.
- **Part C** lists calls the frontend makes that are missing from the API description.
- **Part D** is recommended: server-side delivery checks for reports and audits.
- **Part E** covers off-task detection (detours and stops away from the day's deliveries). It needs station coordinates and extends Part D.

To see the exact request and response shapes the frontend expects, run the frontend with `npm run dev:mock`. That mode answers every call from sample data in `src/mocks/`, using only the fields listed here. The field whitelists are in `src/mocks/mockData.ts` (`PARCEL_FIELDS`, `PARCEL_INFO_FIELDS`, `USER_FIELDS`).

---

## Part A: Delivery location on parcels (required)

### Why

When **Home Delivery** is switched on at parcel intake, staff must now choose where the parcel is going. They either pick a Google Places suggestion (a landmark or business in Ghana) or drop a pin on a map. The frontend sends the chosen point with the parcel. The point is used to show drop-offs on the Rider Map and to check whether the rider's GPS actually reached them.

### A1. New fields on the `Parcel` entity

| Field | Type | Notes |
|---|---|---|
| `receiverLatitude` | double, nullable | WGS84 latitude of the drop-off. |
| `receiverLongitude` | double, nullable | WGS84 longitude of the drop-off. |
| `receiverLocationName` | string (max 200), nullable | Short name shown to staff and riders, e.g. `"Accra Mall"` or `"Near A&C Mall"`. |
| `receiverPlaceId` | string (max 300), nullable | Google Place ID, sent only when picked from search. Store as-is; it is not a foreign key. |
| `receiverLocationSource` | enum `SEARCH` \| `MAP_PIN`, nullable | How the point was chosen. |

All five fields are nullable:

- Parcels created before this change have no location.
- If Google Maps fails to load at the station, the frontend lets staff save without a pin, so intake isn't blocked by an outage.
- Pickup parcels (`homeDelivery = false`) never send a location.

### A2. Accept the fields on create and update

- **`POST /api-frontdesk/parcel`** (`ParcelRequest`): the frontend now sends these fields when `homeDelivery` is `true` and a location was chosen. Example of the extra fields in the body:

  ```json
  {
    "receiverName": "Ama Receiver",
    "receiverAddress": "House 12, Accra",
    "homeDelivery": true,
    "deliveryCost": 30,
    "receiverLatitude": 5.622300,
    "receiverLongitude": -0.173500,
    "receiverLocationName": "Accra Mall",
    "receiverPlaceId": "ChIJ...",
    "receiverLocationSource": "SEARCH"
  }
  ```

- **`PUT /api-frontdesk/parcel/{id}`** (`ParcelUpdateRequest`): accept the same five fields, so a location can be added or corrected later. The frontend sends them from Parcel Search (Set / Change / Remove delivery pin, Request Home Delivery) and from Edit Parcel. It sends them **only when the pin changed**, and sends all five as **`null` to remove a pin**:

  ```json
  { "receiverLatitude": null, "receiverLongitude": null, "receiverLocationName": null, "receiverPlaceId": null, "receiverLocationSource": null }
  ```

  So on update, a field that is **absent** means "leave as is", and an explicit **`null`** means "clear it". If your update code ignores nulls, removing a pin won't work.

Validation:

- If one of `receiverLatitude` / `receiverLongitude` is present, require both.
- Reject latitude outside −90..90 and longitude outside −180..180 with `400` and a JSON message.
- Optionally reject points clearly outside Ghana (roughly latitude 4.5..11.3, longitude −3.4..1.3) with `400 {"message": "Delivery location must be in Ghana"}`. The frontend already restricts search to Ghana.
- Do **not** make the fields required server-side for now (see the outage case in A1).

### A3. Return the fields everywhere a parcel is returned

Add the five fields to:

- The `Parcel` response, in all endpoints returning `Parcel` / `PageParcel`. These include `GET /api-frontdesk/parcels`, `GET /api-admin/parcels`, `GET /api-frontdesk/parcels/home-delivery`, the call-center lists, and tracking.
- **`ParcelInfo`** (inside `DeliveryAssignments.parcels[]`), at least `receiverLatitude`, `receiverLongitude` and `receiverLocationName`. This is the most important one: the Rider Map's delivery check and the rider app read drop-offs from assignments.

Affected assignment endpoints: `GET /api-frontdesk/rider/{riderId}/assignments`, `GET /api-frontdesk/parcel-assignment`, `GET /api-rider/assignments`, and the reconciliation lists.

### A4. Optional: coordinates on saved addresses

Staff can save an address with its delivery cost (`POST /api-frontdesk/addresses`). If `Address` also stored `latitude`, `longitude` and `locationName`, picking a saved address could fill the pin automatically. The frontend doesn't use this yet. It is a nice follow-up, not required.

---

## Part B: Rider tracking pages (access and volume)

### Endpoints the frontend calls

These already exist in the API. Nothing about their shape needs to change:

| Page | Calls |
|---|---|
| Rider Map (live) | `GET /api-admin/riders/location?phoneNumber=` for each rider, every 30 s, at most 6 at a time |
| Rider Map (route history) | `GET /api-admin/riders/track?phoneNumber=&beginTime=&endTime=` (UTC `yyyy-MM-dd HH:mm:ss`, ≤ 2 days, ≤ 3 months back), plus `GET /api-frontdesk/rider/{riderId}/assignments` |
| User Management | `PUT /api-admin/riders/device` with `{ "phoneNumber", "deviceImei" }` |
| Financial dashboard | `GET /api-admin/revenue-dashboard`, `GET /api-admin/rider-performance-dashboard` (with `officeId`, `startDate`, `endDate`) |

### B1. Let managers use these, scoped to their office (required for managers)

The Rider Map and the Financial dashboard are shown to **MANAGER** users in the Delivery Hub, but the endpoints live under `/api-admin`. If `/api-admin/**` is admin-only, managers get `403`. The pages handle that by showing "Your account isn't allowed…", but the features won't work for managers.

Please allow `MANAGER` on these endpoints, limited to riders and figures from the manager's own office:

- `GET /api-admin/riders/location`
- `GET /api-admin/riders/track`
- `GET /api-admin/revenue-dashboard`
- `GET /api-admin/rider-performance-dashboard`

Also allow `ADMIN` / `SUPERADMIN` on `GET /api-frontdesk/rider/{riderId}/assignments`. Route history calls it for admins too.

### B2. Return `deviceImei` on users (required for the "GPS ···1234" label)

`User` in the API description already has `deviceImei`. Please make sure `GET /api-admin/users` and `GET /api-frontdesk/riders/office` actually include it. User Management shows "No GPS device" for every rider if it's missing.

### B3. Bulk live locations (recommended)

The live map makes one request per rider every 30 seconds. That's fine for tens of riders; for hundreds it's wasteful. Please add:

```
GET /api-admin/riders/locations?officeId={optional}
→ 200 [ RiderLocationResponse, ... ]
```

It should return one entry per rider with a device, using the same fields as `RiderLocationResponse`. Riders without a device can be left out, or included with `located: false`. When this exists, the frontend will switch to one call per refresh.

### B4. Remove a device (recommended)

There is no way to unlink a tracker today. Please add:

```
DELETE /api-admin/riders/device?phoneNumber={phone}
→ 200 {"message": "Device removed"}   404 {"message": "Rider not found"}
```

### B5. Return JSON errors from `PUT /api-admin/riders/device` (nice to have)

This endpoint returns plain strings (`"User is not a rider"`). Every other endpoint returns `{"message": ...}`. The frontend handles both, but JSON would be consistent.

### B6. Filter assignments by date (nice to have)

Route history fetches all of a rider's assignments, then keeps the ones in the chosen period. Please add optional `from` / `to` (epoch ms, on `completedAt` or `assignedAt`) to `GET /api-frontdesk/rider/{riderId}/assignments`, so this stays fast for riders with long histories.

---

## Part C: Calls the frontend makes that are missing from the API description

These calls existed in the frontend before this work and are not in `/v3/api-docs`. Please confirm whether each one exists under a different path, or add it:

| Frontend call | Where | Note |
|---|---|---|
| `POST /api-frontdesk/pickup-request` | Pickup Request page | No match in the API description. |
| `POST /api-frontdesk/parcels/{parcelId}/follow-up` | Call center, post-delivery follow-up | The API has `PUT /api-call-center/parcels/{parcelId}/call-outcome`. Is that the replacement? |
| `GET /api-frontdesk/parcels/delivered` | `frontdeskService.getDeliveredParcels` | No match. |
| `DELETE /api-admin/location/{id}` | Station Management, delete location | Only `POST` and `PUT` exist. |

### Already fixed in the frontend (no backend change; please confirm)

The frontend used `POST` for two endpoints the API description lists as `PUT`. Both now send `PUT`:

- `PUT /api-rider/rider-status` (rider Online/Offline switch)
- `PUT /api-frontdesk/driver-assignments/pay` (Driver Tracker, pay drivers)

If the server actually accepts `POST` for either, say so and the frontend can switch back.

---

## Part D: Server-side delivery check (recommended)

### What the frontend does today

On the Rider Map's route history, the frontend loads the rider's GPS track and assignments and checks each delivery in the browser. The rules are in `src/screens/RiderMap/trackUtils.ts` (`checkDeliveries`, `summarize`), with unit tests in `trackUtils.test.ts`:

| Rule | Value |
|---|---|
| A drop-off is **reached** if any GPS point is within this distance of `receiverLatitude/Longitude`… | **150 m** (`VISIT_RADIUS_M`) |
| …during the window from `assignedAt` to `completedAt` + | **30 min** grace |
| Marking delivered/returned while the GPS is further than this from the drop-off is **flagged** | **300 m** (`MARKED_AWAY_M`) |
| A stop is a stretch below this speed… | **3 km/h** |
| …lasting at least | **5 min** |
| Distance | Sum of great-circle distances between consecutive points |
| Gaps between points longer than 15 min | Not counted as moving or stopped |

Each delivery gets one result:

- **reached:** arrival time, departure time, minutes there.
- **not reached:** closest approach in metres, and when.
- **not finished:** not marked done, not reached yet.
- **no pin:** the parcel has no location.
- **no GPS:** no points in the window.

### Why do this on the server too

The browser version only covers one rider and one period at a time, and only when someone opens it. For daily reports, payroll disputes or fraud checks, the backend should compute and store it.

### D1. Capture the rider's position when a delivery is marked (recommended)

In `PUT /api-rider/assignments/{assignmentId}/status`, when `status` is `DELIVERED` or `RETURNED`:

1. Look up the rider's current GPS position. Use the same source as `GET /api-admin/riders/location`.
2. Store on the assignment, per parcel:
   - `markedLatitude`, `markedLongitude`, `markedGpsTime`
   - `markedDistanceFromDropoffM`: the distance to `receiverLatitude/Longitude`, or `null` if either is unknown.
3. Return these in `DeliveryAssignments` / `ParcelInfo`.

This is the single most useful piece. It records where the rider really was at the moment they said "delivered", and it doesn't depend on later track lookups.

### D2. Delivery check endpoint (recommended)

```
GET /api-admin/riders/delivery-check?phoneNumber={phone}&beginTime={UTC}&endTime={UTC}
```

Use the same time format and limits as `/riders/track`. Response:

```json
{
  "riderId": "…",
  "riderName": "Kwame Asante",
  "summary": {
    "deliveries": 5, "reached": 4, "notReached": 1, "notFinished": 0, "noPin": 0, "noGps": 0,
    "markedAway": 1, "distanceKm": 92.6, "movingMinutes": 291, "stoppedMinutes": 44
  },
  "deliveries": [
    {
      "assignmentId": "…", "parcelId": "PF240185", "receiverName": "Akua Badu",
      "receiverLocationName": "Near Airport Shell", "receiverLatitude": 5.6031, "receiverLongitude": -0.1779,
      "status": "DELIVERED", "completedAt": 1763715720000,
      "result": "REACHED",
      "arrivedAt": 1763715240000, "leftAt": 1763716080000,
      "closestDistanceM": 12,
      "markedDistanceFromDropoffM": 20
    },
    {
      "assignmentId": "…", "parcelId": "PF240333", "receiverName": "Mawuli Badu",
      "receiverLocationName": "Near Achimota Mall", "status": "DELIVERED", "completedAt": 1763732640000,
      "result": "NOT_REACHED",
      "closestDistanceM": 600, "closestAt": 1763732220000,
      "markedDistanceFromDropoffM": 600
    }
  ]
}
```

`result` is one of `REACHED`, `NOT_REACHED`, `NOT_FINISHED`, `NO_PIN`, `NO_GPS`.

The same response should also carry the off-task block from Part E (`offTask`).

Please use the rules in the table above so the numbers match what staff see on the map. When this endpoint exists, the frontend will use it instead of computing in the browser.

### D3. Daily summary for all riders (recommended)

```
GET /api-admin/riders/delivery-check/summary?officeId={optional}&date={yyyy-MM-dd}
→ 200 [ { "riderId", "riderName", "deliveries", "reached", "notReached", "noPin", "markedAway",
          "distanceKm", "movingMinutes", "stoppedMinutes",
          "directKm", "detours", "offRouteMinutes", "offRouteKm", "offTaskStops", "offTaskStopMinutes" }, ... ]
```

The frontend can add this as a table on the Rider Map, or as a column on Delivery Analytics, once it exists. Pre-computing it nightly is fine.

---

## Part E: Off-task detection (detours and stops away from deliveries)

### Why

Part D tells you whether the rider reached each drop-off. It doesn't show a rider who does all their deliveries but also rides somewhere unrelated in between, such as a 40-minute side trip or a long stop that isn't at a customer or the station. Part E catches that.

The frontend already does this in the browser for one rider and one period: Rider Map → route history → **Off-task**. The rules are in `src/screens/RiderMap/trackUtils.ts` (`analyzeOffTask`), with unit tests in `trackUtils.test.ts`. Please use the same rules on the server so reports match the screen.

### E1. Station coordinates (required for accurate legs)

Offices (`Office` / `OfficeResponse` in `/api/offices/locations`) have no coordinates today. Please add:

| Field | Type | Notes |
|---|---|---|
| `latitude` | double, nullable | Station location. |
| `longitude` | double, nullable | Station location. |

Accept them on `POST /api-admin/office` and `PUT /api-admin/office/{id}`, and return them wherever an office is returned.

Until these exist, the frontend uses the first and last GPS points of the period as the start and end. That works when riders start and finish at the station, but it misses a detour on the way out or back. The server version should use the rider's office coordinates.

### E2. Rules

1. **Legs.** Build the day's anchors in order:
   - the station,
   - each drop-off the rider **reached** (Part D, within 150 m), ordered by arrival time,
   - the station again.

   Each pair of consecutive anchors is a leg. A leg's time window runs from the rider leaving the first anchor (last GPS point within 150 m) to arriving at the next (first point within 150 m). Drop-offs that weren't reached aren't anchors: the rider is judged on the way to the next place they actually went.

2. **Detours.** For every GPS point inside a leg's window, compute its distance to the straight line between the leg's two anchors. Use a point-to-segment distance; a flat projection is fine at city scale. Consecutive points further than **1,500 m** form a detour. Keep detours lasting at least **3 minutes**, and end a detour at any gap of more than 15 minutes between points. For each detour report:
   - start and end time,
   - the leg (`"Akosua Ofori → Efua Appiah"`),
   - the furthest distance from the line, in metres,
   - the km ridden from the last on-route point before it to the first on-route point after it.

3. **Off-task stops.** Using the same stop rule as Part D (below 3 km/h for 5+ minutes), a stop is **off-task** if it isn't within **200 m** of any of the rider's drop-off pins for the period (reached or not), the station, or the first or last GPS point.

4. **Daily figures:**
   - `directKm`: straight-line distance along the anchors (station → reached drop-offs → station).
   - `distanceKm`: distance actually covered (sum between consecutive GPS points).
   - `offRouteMinutes` and `offRouteKm`: totals over detours.
   - `offTaskStops` and `offTaskStopMinutes`.

5. **When it can't be judged.** If the rider reached no pinned drop-offs in the period, there are no legs. Return `judged: false` with a reason. Off-task stops can still be listed.

Make the thresholds configurable per company if possible (150 m, 1,500 m, 3 min, 200 m, 5 min, 3 km/h). Roads aren't straight, so some companies will want a wider corridor.

### E3. Response block

Add this to the `GET /api-admin/riders/delivery-check` response (Part D2):

```json
"offTask": {
  "judged": true,
  "reason": null,
  "directKm": 91.6,
  "distanceKm": 99.9,
  "offRouteMinutes": 39,
  "offRouteKm": 4.7,
  "detours": [
    {
      "start": 1763721660000, "end": 1763724000000,
      "fromLabel": "Akosua Ofori", "toLabel": "Efua Appiah",
      "maxOffRouteM": 3600, "kmRidden": 4.7
    }
  ],
  "offTaskStops": [
    { "start": 1763722020000, "end": 1763723640000, "lat": 5.5712, "lng": -0.3020, "minutes": 27 }
  ]
}
```

The durations and distances match a demo-data day: the rider leaves the Akosua Ofori → Efua Appiah leg at 10:41, rides 3.6 km off to the side, waits 27 minutes, and comes back at 11:20. The timestamps and coordinates in the example are illustrative.

### E4. Suggested alerts (optional)

Once the daily figures exist, they can drive alerts to managers, for example:

- a detour over 30 minutes,
- an off-task stop over 20 minutes during working hours,
- `distanceKm` more than 1.5× `directKm` for the day.

Thresholds should be configurable. Nothing in the frontend depends on alerts yet.

---

## Frontend follow-ups (no backend work)

Once A3 is in place, the frontend team should:

- ~~**Rider app:** pass the new fields through `riderService.getAssignments` and point Directions at the pin.~~ **Done.** The rider app reads `receiverLatitude`, `receiverLongitude` and `receiverLocationName` from `GET /api-rider/assignments` (`ParcelInfo`). Directions open Google Maps routing to the pin, and fall back to searching the address text when there's no pin. **This only works once A3 returns these fields on `ParcelInfo` for the rider endpoint.**
- ~~**Parcel Search / Edit Parcel:** let staff add or correct a pin on existing parcels.~~ **Done.** Parcel Search shows the pin in parcel details, with Add / Change / Remove, and Request Home Delivery asks for one. Edit Parcel has the pin field, which is required when switching Home Delivery on. Both use `PUT /api-frontdesk/parcel/{id}` (A2, including `null` to remove).

---

## Checklist for the backend

- [ ] A1 Parcel entity has the five location fields (nullable).
- [ ] A2 `POST` and `PUT /api-frontdesk/parcel` accept them, with lat/lng validation.
- [ ] A3 Fields are returned on `Parcel` and on `ParcelInfo` in every assignment endpoint.
- [ ] B1 `MANAGER` can call `riders/location`, `riders/track`, `revenue-dashboard` and `rider-performance-dashboard` for their office; `ADMIN` can call `rider/{id}/assignments`.
- [ ] B2 `deviceImei` is returned on users.
- [ ] B3 `GET /api-admin/riders/locations` (bulk). *(recommended)*
- [ ] B4 `DELETE /api-admin/riders/device`. *(recommended)*
- [ ] C Confirm or add the four missing endpoints. Confirm `PUT` for rider-status and driver pay.
- [ ] D1 Store the rider's position when a delivery is marked. *(recommended)*
- [ ] D2 / D3 Delivery check endpoints. *(recommended)*
- [ ] E1 Station (office) `latitude` / `longitude`.
- [ ] E2 / E3 Off-task block (detours, off-task stops, daily figures) in the delivery-check responses. *(recommended)*
- [ ] E4 Alerts. *(optional)*

Questions about the frontend side: the relevant code is in `src/components/DeliveryLocationPicker.tsx`, `src/screens/ParcelRegistration/`, `src/screens/RiderMap/` (rules in `trackUtils.ts`) and `src/services/adminService.ts`.
