import * as React from 'react';
import { useState } from 'react';
import { GardenObject, InventoryItem } from '../types/garden';
import { useCredits } from '../contexts/CreditsContext';

type ObjectItemProps = {
  object: GardenObject;
  onBuy: (object: GardenObject) => void;
  inventory: InventoryItem[];
};

function ObjectItem({ object, onBuy, inventory }: ObjectItemProps) {
  const { creditsData } = useCredits();
  const canAfford = creditsData.totalCredits >= object.price;
  const [isClicked, setIsClicked] = useState(false);

  const purchasedItem = inventory.find(item => item.itemId === object.id);
  const purchasedQuantity = purchasedItem ? purchasedItem.quantity : 0;

  const handleClick = () => {
    if (canAfford) {
      onBuy(object);
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
        canAfford 
          ? 'border-emerald-200 hover:border-emerald-300 hover:scale-105' 
          : 'border-gray-200 opacity-60 cursor-not-allowed'
      } ${isClicked ? 'scale-95' : ''}`}
      onClick={handleClick}
    >
      <div className="p-2 text-center">
        {purchasedQuantity > 0 && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            보유: {purchasedQuantity}
          </div>
        )}
        <div className="mb-2" style={{ height: '80px' }}><img src={object.image} alt={object.name} style={{ maxHeight: '100%', maxWidth: '100%' }} /></div>
        <div className="font-medium text-gray-800 text-sm mb-1">{object.name}</div>
        <div className="flex items-center justify-center space-x-1 text-xs text-emerald-600">
          <span className="text-xs">💰</span>
          <span className="font-semibold">{object.price}</span>
        </div>
      </div>
      
      {!canAfford && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-80 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-500 font-medium">크레딧 부족</span>
        </div>
      )}
      
      <div className="absolute top-2 right-2">
        <div className={`w-2 h-2 rounded-full ${
          canAfford ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
      </div>
    </div>
  );
}

export default ObjectItem;
