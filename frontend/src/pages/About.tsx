import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

const About: React.FC = () => {
  return (
    <div style={styles.page}>
      <PageHeader 
        title="About Us" 
        subtitle="Ecoo와 함께 지속 가능한 미래를 만들어가세요"
        icon="ℹ️"
      />

      <div style={styles.container}>
        <p style={styles.subtitle}>
          Ecoo 챗봇과 함께하는 탄소 절감 프로젝트는 <br />
          사용자의 교통, 생활 데이터를 기반으로 탄소 절감 효과를 알려주고, <br />
          절약한 만큼 에코 크레딧을 제공하는 서비스입니다.
        </p>

        <div style={styles.cards}>
          <Link to="/dashboard" style={styles.cardLink}>
            <div style={styles.card} className="card clickable-card">
              <div style={styles.cardIcon}>🌱</div>
              <h3 style={styles.cardTitle}>탄소 절감 분석</h3>
              <p style={styles.cardText}>
                대중교통, 자전거, 도보 이용 데이터를 분석하여
                <br /> 절감한 CO₂를 시각적으로 보여줍니다.
              </p>
            </div>
          </Link>
          <Link to="/credit" style={styles.cardLink}>
            <div style={styles.card} className="card clickable-card">
              <div style={styles.cardIcon}>💰</div>
              <h3 style={styles.cardTitle}>에코 크레딧</h3>
              <p style={styles.cardText}>
                절약한 탄소량을 포인트로 전환하고,
                <br /> 다양한 보상 체계로 활용할 수 있습니다.
              </p>
            </div>
          </Link>
          <Link to="/chat" style={styles.cardLink}>
            <div style={styles.card} className="card clickable-card">
              <div style={styles.cardIcon}>🤖</div>
              <h3 style={styles.cardTitle}>AI 챗봇</h3>
              <p style={styles.cardText}>
                맞춤형 AI 챗봇이 사용자에게 실시간 피드백을 제공하고,
                <br /> 지속 가능한 생활을 돕습니다.
              </p>
            </div>
          </Link>
          <Link to="/mygarden" style={styles.cardLink}>
            <div style={styles.card} className="card clickable-card">
              <div style={styles.cardIcon}>🌿</div>
              <h3 style={styles.cardTitle}>나만의 정원 꾸미기</h3>
              <p style={styles.cardText}>
                에코 크레딧으로 가상 정원을 키우고 꾸며보세요.
                <br /> 물주기와 성장을 통해 지속적인 동기부여를 제공합니다.
              </p>
            </div>
          </Link>
        </div>

        {/* 팀 소개 섹션 */}
        <section style={styles.teamSection}>
          <h3 style={styles.teamTitle}>👥 개발팀 소개</h3>
          <div style={styles.teamCards}>
            <div style={styles.teamCard} className="team-card">
              <div style={styles.teamMember}>송인섭</div>
              <div style={styles.teamRole}>🤖 AI와 대화하는 사람</div>
            </div>
            <div style={styles.teamCard} className="team-card">
              <div style={styles.teamMember}>김규리</div>
              <div style={styles.teamRole}>👑 모든 걸 연결하는 마법사</div>
            </div>
            <div style={styles.teamCard} className="team-card">
              <div style={styles.teamMember}>이승재</div>
              <div style={styles.teamRole}>🌱 탄소를 잡는 사냥꾼</div>
            </div>
          </div>
          <p style={styles.teamDescription}>
            서울시 AI 해커톤 8팀 충무로팀
          </p>
        </section>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    backgroundColor: "#f8fffe",
    padding: "0",
    fontFamily: "'Pretendard', sans-serif",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
  },
  
  // 히어로 섹션
  heroSection: {
    background: "linear-gradient(135deg, #1abc9c 0%, #16a085 50%, #27ae60 100%)",
    padding: "120px 20px 80px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "800px",
    margin: "0 auto",
  },
  heroTitle: {
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "white",
    marginBottom: "20px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  heroSubtitle: {
    fontSize: "1.3rem",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 500,
    textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
  },
  heroDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingElement1: {
    position: "absolute",
    top: "20%",
    left: "10%",
    fontSize: "3rem",
    animation: "float 6s ease-in-out infinite",
    opacity: 0.7,
  },
  floatingElement2: {
    position: "absolute",
    top: "60%",
    right: "15%",
    fontSize: "2.5rem",
    animation: "float 8s ease-in-out infinite reverse",
    opacity: 0.6,
  },
  floatingElement3: {
    position: "absolute",
    top: "30%",
    right: "5%",
    fontSize: "2rem",
    animation: "float 7s ease-in-out infinite",
    opacity: 0.5,
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 20px",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#2c3e50",
    marginBottom: "80px",
    lineHeight: "1.8",
    maxWidth: "800px",
    margin: "0 auto 80px",
    fontWeight: 400,
  },
  
  // 카드 그리드
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "40px",
    marginBottom: "100px",
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
  },
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    padding: "40px 30px",
    borderRadius: "25px",
    border: "1px solid rgba(26, 188, 156, 0.1)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 10px 40px rgba(26, 188, 156, 0.1)",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(10px)",
  },
  cardIcon: {
    fontSize: "3rem",
    marginBottom: "20px",
    display: "block",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#2c3e50",
    marginBottom: "20px",
  },
  cardText: {
    fontSize: "1.1rem",
    color: "#6b7280",
    lineHeight: "1.7",
    fontWeight: 400,
  },

  // 팀 소개 섹션
  teamSection: {
    background: "linear-gradient(135deg, #f8fffe 0%, #e8f5f3 100%)",
    padding: "60px 40px",
    borderRadius: "30px",
    marginTop: "40px",
    position: "relative",
    overflow: "hidden",
  },
  teamTitle: {
    fontSize: "2.2rem",
    fontWeight: 700,
    color: "#2c3e50",
    marginBottom: "40px",
  },
  teamCards: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  teamCard: {
    background: "rgba(255, 255, 255, 0.9)",
    padding: "30px 25px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(26, 188, 156, 0.15)",
    border: "1px solid rgba(26, 188, 156, 0.1)",
    transition: "all 0.3s ease",
    minWidth: "180px",
  },
  teamMember: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#2c3e50",
    marginBottom: "8px",
  },
  teamRole: {
    fontSize: "1rem",
    color: "#1abc9c",
    fontWeight: 500,
  },
  teamDescription: {
    fontSize: "1.1rem",
    color: "#6b7280",
    fontWeight: 500,
    fontStyle: "italic",
  },

  // 호버 효과
  cardHover: {
    transform: "translateY(-10px) scale(1.02)",
    boxShadow: "0 20px 60px rgba(26, 188, 156, 0.2)",
    borderColor: "rgba(26, 188, 156, 0.3)",
  },
  teamCardHover: {
    transform: "translateY(-5px)",
    boxShadow: "0 15px 35px rgba(26, 188, 156, 0.25)",
  },
};

// CSS 애니메이션 추가
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  .card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 60px rgba(26, 188, 156, 0.2);
    border-color: rgba(26, 188, 156, 0.3);
  }
  
  .team-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(26, 188, 156, 0.25);
  }
`;
document.head.appendChild(styleSheet);

export default About;
