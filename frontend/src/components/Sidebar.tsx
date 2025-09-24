import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const location = useLocation();

  // 링크 클릭 시 스크롤 초기화
  const handleLinkClick = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const sidebarItems = [
    {
      category: "서비스",
      items: [
        { path: "/chat", label: "AI 챗봇", icon: "🤖" },
        { path: "/mygarden", label: "나만의 정원", icon: "🌿" },
        { path: "/challenge-achievements", label: "챌린지 & 업적", icon: "🏆" },
        { path: "/dashboard", label: "대시보드", icon: "📊" },
        { path: "/credit", label: "Credit", icon: "💰" },
        { path: "/mobility-tracking", label: "이동 기록 측정", icon: "🚶" }, // New mobility tracking link
        { path: "/groups", label: "그룹", icon: "👥" },
      ]
    },
    {
      category: "정보",
      items: [
        { path: "/notice", label: "Notice", icon: "📢" },
        { path: "/about", label: "About Us", icon: "ℹ️" },
        { path: "/user-info", label: "마이페이지", icon: "👤" },
        { path: "/contact", label: "Contact", icon: "📞" },
        { path: "/howto", label: "How to Use", icon: "❓" },
      ]
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo-link" onClick={handleLinkClick}>
          <h2 className="sidebar-title">ECO 🌱 LIFE</h2>
        </Link>
      </div>
      
      <nav className="sidebar-nav">
        {sidebarItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="nav-section">
            <h3 className="nav-section-title">{section.category}</h3>
            <ul className="nav-list">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
