import React, { useState, useEffect } from 'react';

interface NewsItem {
  id: number;
  text: string;
}

interface NewsTickerProps {
  news: NewsItem[];
}

const NewsTicker: React.FC<NewsTickerProps> = ({ news }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
    }, 3000); // Change news item every 3 seconds
    return () => clearInterval(interval);
  }, [news.length]);

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="news-ticker-container">
      <div className="news-ticker-item">
        <p>{news[currentIndex].text}</p>
      </div>
    </div>
  );
};

export default NewsTicker;