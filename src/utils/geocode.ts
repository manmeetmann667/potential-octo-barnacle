export const getCoordinates = async (address: string) => {
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;
    const url = `https://geocode.maps.co/search?q=${encodeURIComponent(
      address
    )}&api_key=${apiKey}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch coordinates");
  
      const data = await response.json();
      if (data.length === 0) throw new Error("No results found");
  
      return { lat: data[0].lat, lon: data[0].lon };
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };
  
  export const getAddress = async (lat: number, lon: number) => {
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;
    const url = `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&api_key=${apiKey}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch address");
  
      const data = await response.json();
      return data.display_name; // Full address as a string
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  };
  