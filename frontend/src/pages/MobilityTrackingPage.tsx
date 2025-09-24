import React from 'react';
import MobilityTracker from '../components/MobilityTracker';
import './MobilityTrackingPage.css'; // Import the new CSS file

const MobilityTrackingPage: React.FC = () => {
  return (
    <div className="mobility-tracking-page"> {/* Apply main page style */}
      <div className="container">
        <h2 className="text-center">이동 기록 측정</h2>
        <div className="mobility-tracker-container"> {/* Apply container style for MobilityTracker */}
          <MobilityTracker />
        </div>
      </div>
    </div>
  );
};

export default MobilityTrackingPage;
