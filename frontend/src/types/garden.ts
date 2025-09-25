// Updated: Added placed_id and nested object to PlacedObject
export interface GardenObject {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  image: string;
}

export interface PlacedObject {
  placed_id: number;
  item_id: string;
  x: number;
  y: number;
  object: GardenObject;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  object: GardenObject;
}