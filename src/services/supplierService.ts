import axios from 'axios';

export const findSuppliersNearby = async (location: string, radiusKm: number) => {
  // En una implementación real, usaríamos Google Places API
  // const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusKm * 1000}&type=car_repair&key=${process.env.GOOGLE_MAPS_KEY}`;
  
  console.log(`Buscando proveedores cerca de ${location} en un radio de ${radiusKm}km`);
  
  // Datos simulados (Mock) basándonos en la zona de Canadá
  return [
    { name: 'NAPA Auto Parts - Downtown', address: '456 Queen St W, Toronto', distance: '1.2 km', lat: 43.648, lng: -79.396 },
    { name: 'Canadian Tire', address: '839 Yonge St, Toronto', distance: '3.5 km', lat: 43.671, lng: -79.387 },
    { name: 'PartSource', address: '1111 Dundas St W, Toronto', distance: '5.0 km', lat: 43.649, lng: -79.424 },
  ];
};
