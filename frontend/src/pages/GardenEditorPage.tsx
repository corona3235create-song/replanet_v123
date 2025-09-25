import React from 'react';
import GardenEditor from '../components/GardenEditor';
import PageHeader from '../components/PageHeader';

function GardenEditorPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <PageHeader 
        title="나만의 정원 꾸미기"
        subtitle="상점에서 구매한 아이템으로 정원을 자유롭게 꾸며보세요."
        icon="🌳"
      />
      <GardenEditor />
    </div>
  );
}

export default GardenEditorPage;
