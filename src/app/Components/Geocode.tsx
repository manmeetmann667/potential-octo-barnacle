"use client";
import { useState } from "react";
import { getCoordinates, getAddress } from "@/utils/geocode";

const Geocode = () => {
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(
    null
  );
  const [reverseAddress, setReverseAddress] = useState("");

  const handleForwardGeocode = async () => {
    const result = await getCoordinates(address);
    setCoords(result);
  };

  const handleReverseGeocode = async () => {
    if (!coords) return;
    const result = await getAddress(parseFloat(coords.lat), parseFloat(coords.lon));
    setReverseAddress(result || "Address not found");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Geocoding with Maps.co</h2>

      {/* Forward Geocoding */}
      <input
        type="text"
        placeholder="Enter an address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="p-2 border rounded"
      />
      <button onClick={handleForwardGeocode} className="ml-2 p-2 bg-blue-500 text-white rounded">
        Get Coordinates
      </button>

      {coords && (
        <p className="mt-2">
          <strong>Latitude:</strong> {coords.lat}, <strong>Longitude:</strong> {coords.lon}
        </p>
      )}

      {/* Reverse Geocoding */}
      <button onClick={handleReverseGeocode} className="mt-4 p-2 bg-green-500 text-white rounded">
        Get Address from Coordinates
      </button>

      {reverseAddress && <p className="mt-2"><strong>Address:</strong> {reverseAddress}</p>}
    </div>
  );
};

export default Geocode;
