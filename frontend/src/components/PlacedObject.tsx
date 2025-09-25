import React, { useState } from 'react';
import { PlacedObject } from '../types/garden';

interface PlacedObjectProps {
  object: PlacedObject;
  onRemove: (id: number) => void;
  onUpdatePosition: (placedId: number, x: number, y: number) => void;
}

const PlacedObjectComponent: React.FC<PlacedObjectProps> = ({ object, onRemove, onUpdatePosition }) => {
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentX, setCurrentX] = useState(object.x);
  const [currentY, setCurrentY] = useState(object.y);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffsetX(e.clientX - rect.left);
    setDragOffsetY(e.clientY - rect.top);
    e.dataTransfer.setData("placedId", String(object.placed_id));
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!parentRect || e.clientX === 0 || e.clientY === 0) return;

    let newX = ((e.clientX - parentRect.left - dragOffsetX) / parentRect.width) * 100;
    let newY = ((e.clientY - parentRect.top - dragOffsetY) / parentRect.height) * 100;

    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setCurrentX(newX);
    setCurrentY(newY);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    onUpdatePosition(object.placed_id, currentX, currentY);
  };

  return (
    <div 
      onClick={handleToggleActive}
      draggable="true"
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        position: 'absolute',
        left: `${currentX}%`,
        top: `${currentY}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        textAlign: 'center',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isActive ? '2px solid #10b981' : 'none',
        transition: isDragging ? 'none' : 'border 0.1s ease-in-out',
        zIndex: isDragging ? 1000 : 1,
      }}
    >
      <img 
        src={object.object.image} 
        alt={object.object.name} 
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
      />
      {isActive && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(object.placed_id); }}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            lineHeight: '20px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1001,
          }}
        >
          X
        </button>
      )}
    </div>
  );
};

export default PlacedObjectComponent;
