import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, PlacedObject, GardenObject } from '../types/garden';
import { getAuthHeaders } from '../contexts/CreditsContext';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const useGarden = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [inventoryRes, objectsRes] = await Promise.all([
        fetch(`${API_URL}/api/garden/inventory`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/garden/objects`, { headers: getAuthHeaders() }),
      ]);

      if (!inventoryRes.ok || !objectsRes.ok) {
        throw new Error('Failed to fetch garden data');
      }

      const inventoryData = await inventoryRes.json();
      const placedData = await objectsRes.json();

      console.log("Fetched Inventory Data:", inventoryData); // Added console.log

      setInventory(inventoryData);
      setPlacedObjects(placedData);
    } catch (error) {
      console.error("Error fetching garden data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const purchaseItem = useCallback(async (item: GardenObject) => {
    try {
      const response = await fetch(`${API_URL}/api/shop/buy`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ item_id: item.id, quantity: 1 }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Purchase failed');
      }
      await fetchData(); // Refresh data after purchase
    } catch (error) {
      console.error("Error purchasing item:", error);
      throw error;
    }
  }, [fetchData]);

  const placeObject = useCallback(async (itemId: string, x: number, y: number) => {
    try {
      const response = await fetch(`${API_URL}/api/garden/place`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ item_id: itemId, x, y }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to place object');
      }
      await fetchData(); // Refresh data after placing
    } catch (error) {
      console.error("Error placing object:", error);
      throw error;
    }
  }, [fetchData]);

  const removeObject = useCallback(async (placedId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/garden/remove/${placedId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to remove object');
      }
      await fetchData(); // Refresh data after removing
    } catch (error) {
      console.error("Error removing object:", error);
      throw error;
    }
  }, [fetchData]);

  const updatePlacedObjectPosition = useCallback(async (placedId: number, x: number, y: number) => {
    try {
      const response = await fetch(`${API_URL}/api/garden/update_position`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ placed_id: placedId, x, y }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update object position');
      }
      await fetchData(); // Refresh data after updating position
    } catch (error) {
      console.error("Error updating object position:", error);
      throw error;
    }
  }, [fetchData]);

  return { inventory, placedObjects, loading, purchaseItem, placeObject, removeObject, updatePlacedObjectPosition, refresh: fetchData };
};
