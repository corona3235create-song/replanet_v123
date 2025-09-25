import React, { useState, useEffect } from 'react';
import { GardenObject, InventoryItem } from '../types/garden';
import ObjectItem from './ObjectItem';
import { getAuthHeaders } from '../contexts/CreditsContext';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

type ObjectShopProps = {
  onObjectBuy: (object: GardenObject) => void;
  inventory: InventoryItem[];
};

function ObjectShop({ onObjectBuy, inventory }: ObjectShopProps) {
  const [items, setItems] = useState<GardenObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/shop/items`, { headers: getAuthHeaders() });
        if (!response.ok) {
          throw new Error('Failed to fetch shop items');
        }
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return <div>Loading shop...</div>;
  }

  return (
    <>
      {items.map(obj => (
        <ObjectItem key={obj.id} object={obj} onBuy={onObjectBuy} inventory={inventory} />
      ))}
    </>
  );
}

export default ObjectShop;
