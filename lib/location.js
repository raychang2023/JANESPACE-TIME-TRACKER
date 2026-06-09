export const WAREHOUSE_LOCATION = {
  latitude: -19.293479,
  longitude: 146.7704773,
  radiusMeters: 150,
  label: "24 Madden St, Aitkenvale QLD 4814"
};

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function validateCoordinates({ latitude, longitude, accuracy }) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  const acc = accuracy === undefined || accuracy === null || accuracy === "" ? null : toNumber(accuracy);

  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lng,
    accuracy: acc !== null && acc >= 0 ? acc : null
  };
}

export function distanceMeters(from, to = WAREHOUSE_LOCATION) {
  const earthRadius = 6371000;
  const fromLat = (from.latitude * Math.PI) / 180;
  const toLat = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
}

export function validateWarehouseDistance(input) {
  const coordinates = validateCoordinates(input);
  if (!coordinates) {
    return { ok: false, error: "Location is required to clock in/out on site" };
  }

  const distance = distanceMeters(coordinates);
  if (distance > WAREHOUSE_LOCATION.radiusMeters) {
    return {
      ok: false,
      error: `You are ${distance}m from the warehouse. Clock in/out is only allowed within ${WAREHOUSE_LOCATION.radiusMeters}m.`,
      coordinates,
      distanceMeters: distance
    };
  }

  return {
    ok: true,
    coordinates,
    distanceMeters: distance
  };
}
