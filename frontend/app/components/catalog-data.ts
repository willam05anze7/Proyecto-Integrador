export type FuelType = "Gasolina" | "Diésel" | "Híbrido" | "Eléctrico";

export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  fuelType: FuelType | null;
  image: string;
  isFleetVehicle?: boolean;
};

export type Product = {
  id: string;
  name: string;
  code: string;
  brand: string;
  price: number;
  available: number;
  category: "Repuestos" | "Accesorios" | "Asientos para bebés";
  image: string;
  compatibleWith: string[];
};

export const vehicles: Vehicle[] = [
  {
    id: "toyota-corolla",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    type: "Sedán",
    fuelType: null,
    image: "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "toyota-rav4",
    brand: "Toyota",
    model: "RAV4",
    year: 2023,
    type: "SUV",
    fuelType: null,
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "honda-civic",
    brand: "Honda",
    model: "Civic",
    year: 2021,
    type: "Sedán",
    fuelType: null,
    image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "nissan-xtrail",
    brand: "Nissan",
    model: "X-Trail",
    year: 2024,
    type: "SUV",
    fuelType: null,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=85",
  },
];

export const products: Product[] = [
  {
    id: "filtro-aceite",
    name: "Filtro de aceite premium",
    code: "GC-FO-2048",
    brand: "Denso",
    price: 185,
    available: 12,
    category: "Repuestos",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=85",
    compatibleWith: ["toyota-corolla", "toyota-rav4"],
  },
  {
    id: "pastillas-freno",
    name: "Pastillas de freno cerámicas",
    code: "GC-PF-1102",
    brand: "Brembo",
    price: 640,
    available: 8,
    category: "Repuestos",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=85",
    compatibleWith: ["toyota-corolla", "honda-civic"],
  },
  {
    id: "bateria-12v",
    name: "Batería 12V alto rendimiento",
    code: "GC-BT-3015",
    brand: "Bosch",
    price: 1250,
    available: 5,
    category: "Repuestos",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=85",
    compatibleWith: ["toyota-corolla", "toyota-rav4", "honda-civic", "nissan-xtrail"],
  },
  {
    id: "fundas-cuero",
    name: "Fundas de asiento efecto cuero",
    code: "GC-AC-4201",
    brand: "Global Car",
    price: 890,
    available: 9,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=900&q=85",
    compatibleWith: ["toyota-corolla", "toyota-rav4", "honda-civic", "nissan-xtrail"],
  },
  {
    id: "alfombras",
    name: "Alfombras premium a medida",
    code: "GC-AC-4208",
    brand: "Global Car",
    price: 420,
    available: 14,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85",
    compatibleWith: ["toyota-corolla", "toyota-rav4", "honda-civic", "nissan-xtrail"],
  },
  {
    id: "luces-led",
    name: "Kit de luces LED blancas",
    code: "GC-AC-4310",
    brand: "Philips",
    price: 560,
    available: 6,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
    compatibleWith: ["toyota-corolla", "toyota-rav4", "honda-civic", "nissan-xtrail"],
  },
  {
    id: "silla-bebe",
    name: "Asiento infantil seguro i-Size",
    code: "GC-BB-5104",
    brand: "Maxi-Cosi",
    price: 1890,
    available: 4,
    category: "Asientos para bebés",
    image: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?auto=format&fit=crop&w=900&q=85",
    compatibleWith: ["toyota-corolla", "toyota-rav4", "honda-civic", "nissan-xtrail"],
  },
];
