import * as React from 'react';
import { useGarden } from '../hooks/useGarden';
import PlacedObjectComponent from './PlacedObject';

function GardenEditor() {
  const { inventory, placedObjects, placeObject, removeObject, updatePlacedObjectPosition, loading } = useGarden();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    e.dataTransfer.setData("itemId", itemId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");
    if (!itemId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    try {
      await placeObject(itemId, x, y);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  if (loading) {
    return <div>Loading Garden...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', minHeight: '600px' }}>
      {/* 구매한 아이템 목록 */}
      <div style={{ 
        width: '200px', 
        background: 'white', 
        borderRadius: '0.5rem', 
        padding: '1rem',
        border: '1px solid #dcfce7',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
          보유 아이템
        </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {inventory.map((invItem, index) => {
              if (invItem.quantity === 0) return null;
              
              return (
                <div
                  key={`${invItem.itemId}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, invItem.itemId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    cursor: 'grab',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={invItem.object.image} alt={invItem.object.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{invItem.object.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>보유: {invItem.quantity}개</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      {/* 정원 공간 */}
      <div style={{ flex: 1 }}>
        {/* 정원 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🌳</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>나의 정원</h2>
            <div style={{ 
              backgroundColor: '#d1fae5', 
              color: '#059669', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '9999px', 
              fontSize: '0.75rem', 
              fontWeight: '600' 
            }}>
              {placedObjects.length}개 배치됨
            </div>
          </div>
        </div>

        {/* 정원 영역 */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #dcfce7 0%, #ecfdf5 100%)',
            borderRadius: '1rem',
            border: '2px dashed #10b981',
            height: '500px',
            overflow: 'hidden'
          }}
        >
          {placedObjects.map(obj => (
            <PlacedObjectComponent 
              key={obj.placed_id} 
              object={obj} 
              onRemove={removeObject}
              onUpdatePosition={updatePlacedObjectPosition}
            />
          ))}
          
          {placedObjects.length === 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '4rem', color: '#a7f3d0', display: 'block', marginBottom: '1rem' }}>🌳</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#4b5563', marginBottom: '0.5rem' }}>
                  정원이 비어있습니다
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  상점에서 아이템을 구매하고 배치해보세요!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GardenEditor;