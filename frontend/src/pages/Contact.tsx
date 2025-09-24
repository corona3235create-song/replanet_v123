import React, { useState } from "react";
import PageHeader from "../components/PageHeader";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제 구현에서는 여기서 이메일 전송 API를 호출
    alert("문의가 전송되었습니다! 빠른 시일 내에 답변드리겠습니다.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div style={styles.page}>
      <PageHeader 
        title="Contact" 
        subtitle="Ecoo와 함께 소통하고 협력해보세요"
        icon="📞"
      />

      <div style={styles.container}>
        {/* About Our Team - 전체 너비 */}
        <div style={styles.fullWidthSection}>
          <div style={styles.card} className="card">
            <div style={styles.cardIcon}>🌱</div>
            <h3 style={styles.cardTitle}>About Our Team</h3>
            <p style={styles.cardDescription}>
              Ecoo 챗봇과 함께하는 탄소 절감 프로젝트 팀입니다. <br />
              우리는 AI와 데이터를 활용해 더 지속 가능한 도시 생활을 만들고자 합니다. <br />
              문의나 협업 제안은 아래 이메일로 언제든 연락 주세요.
            </p>
          </div>
        </div>

        {/* 나머지 요소들 - 2분할 그리드 */}
        <div style={styles.twoColumnGrid} className="two-column-grid">
          {/* 왼쪽 컬럼 */}
          <div style={styles.column}>
            <div style={styles.card} className="card">
              <div style={styles.cardIcon}>📩</div>
              <h3 style={styles.cardTitle}>Email</h3>
              <p style={styles.email}>sophia.gyuri@gmail.com</p>
              <p style={styles.cardDescription}>
                24시간 내 답변드립니다
              </p>
            </div>

            <div style={styles.card} className="card">
              <div style={styles.cardIcon}>👩‍💻</div>
              <h3 style={styles.cardTitle}>Our Team</h3>
              <div style={styles.teamMembers}>
                <div style={styles.teamMember}>
                  <div style={styles.memberName}>송인섭</div>
                  <div style={styles.memberRole}>🤖 AI와 대화하는 사람</div>
                </div>
                <div style={styles.teamMember}>
                  <div style={styles.memberName}>김규리</div>
                  <div style={styles.memberRole}>👑 모든 걸 연결하는 마법사</div>
                </div>
                <div style={styles.teamMember}>
                  <div style={styles.memberName}>이승재</div>
                  <div style={styles.memberRole}>🌱 탄소를 잡는 사냥꾼</div>
                </div>
              </div>
              <p style={styles.teamDescription}>
                서울시 AI 해커톤 8팀 충무로팀
              </p>
            </div>
          </div>

          {/* 오른쪽 컬럼 */}
          <div style={styles.column}>
            <div style={styles.card} className="card">
              <div style={styles.cardIcon}>🚀</div>
              <h3 style={styles.cardTitle}>프로젝트 정보</h3>
              <div style={styles.projectInfo}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>개발 기간:</span>
                  <span style={styles.infoValue}>2024.08 - 2024.09</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>기술 스택:</span>
                  <span style={styles.infoValue}>React, FastAPI, MySQL, AWS</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>주제:</span>
                  <span style={styles.infoValue}>서울시 에코 AI 챗봇과 함께하는 탄소절감 프로젝트</span>
                </div>
              </div>
            </div>

            {/* 문의 폼 */}
            <div style={styles.formCard} className="form-card">
              <h3 style={styles.formTitle}>💬 문의하기</h3>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>이름 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                    placeholder="이름을 입력해주세요"
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>이메일 *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                    placeholder="이메일을 입력해주세요"
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>제목 *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                    placeholder="문의 제목을 입력해주세요"
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>메시지 *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    style={styles.textarea}
                    placeholder="문의 내용을 자세히 입력해주세요"
                    rows={5}
                  />
                </div>
                
                <button type="submit" style={styles.submitButton}>
                  📤 문의 전송하기
                </button>
              </form>
            </div>
          </div>
        </div>
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
    fontSize: "2.8rem",
    fontWeight: 800,
    color: "white",
    marginBottom: "20px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
    lineHeight: "1.2",
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

  // 전체 너비 섹션 (About Our Team)
  fullWidthSection: {
    marginBottom: "60px",
  },

  // 2분할 그리드
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    alignItems: "flex-start",
  },

  // 컬럼
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },

  // 정보 섹션 (기존 유지)
  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
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
    textAlign: "center",
  },
  cardIcon: {
    fontSize: "3rem",
    marginBottom: "20px",
    display: "block",
  },
  cardTitle: {
    fontSize: "1.8rem", /* 22-24px 이상 권장사항 적용 */
    fontWeight: 700,
    color: "#2c3e50",
    marginBottom: "20px",
  },
  email: {
    fontSize: "1.4rem", /* 18px 전후로 증가 */
    color: "#1abc9c",
    fontWeight: 600,
    marginBottom: "10px",
  },
  cardDescription: {
    fontSize: "1.2rem", /* 18px 전후로 증가 */
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: 1.6, /* 줄 간격 증가 */
  },

  // 팀 멤버
  teamMembers: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginBottom: "20px",
  },
  teamMember: {
    padding: "15px",
    background: "rgba(26, 188, 156, 0.05)",
    borderRadius: "15px",
    border: "1px solid rgba(26, 188, 156, 0.1)",
  },
  memberName: {
    fontSize: "1.3rem", /* 18px 전후로 증가 */
    fontWeight: 700,
    color: "#2c3e50",
    marginBottom: "5px",
  },
  memberRole: {
    fontSize: "1.1rem", /* 18px 전후로 증가 */
    color: "#1abc9c",
    fontWeight: 500,
  },
  teamDescription: {
    fontSize: "1.2rem", /* 18px 전후로 증가 */
    color: "#6b7280",
    fontWeight: 500,
    fontStyle: "italic",
  },

  // 프로젝트 정보
  projectInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(26, 188, 156, 0.1)",
  },
  infoLabel: {
    fontSize: "1.1rem", /* 18px 전후로 증가 */
    color: "#6b7280",
    fontWeight: 500,
  },
  infoValue: {
    fontSize: "1.1rem", /* 18px 전후로 증가 */
    color: "#2c3e50",
    fontWeight: 600,
  },

  // 폼 섹션
  formSection: {
    position: "sticky",
    top: "100px",
  },
  formCard: {
    background: "rgba(255, 255, 255, 0.95)",
    padding: "40px",
    borderRadius: "25px",
    border: "1px solid rgba(26, 188, 156, 0.1)",
    boxShadow: "0 15px 50px rgba(26, 188, 156, 0.15)",
    backdropFilter: "blur(10px)",
    position: "relative",
    overflow: "hidden",
  },
  formTitle: {
    fontSize: "2.2rem", /* 22-24px 이상 권장사항 적용 */
    fontWeight: 700,
    color: "#2c3e50",
    marginBottom: "30px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "1.2rem", /* 18px 전후로 증가 */
    fontWeight: 600,
    color: "#2c3e50",
  },
  input: {
    padding: "18px 24px", /* 패딩 증가 */
    border: "2px solid rgba(26, 188, 156, 0.2)",
    borderRadius: "15px",
    fontSize: "1.2rem", /* 18px 전후로 증가 */
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.8)",
    outline: "none",
  },
  textarea: {
    padding: "18px 24px", /* 패딩 증가 */
    border: "2px solid rgba(26, 188, 156, 0.2)",
    borderRadius: "15px",
    fontSize: "1.2rem", /* 18px 전후로 증가 */
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.8)",
    outline: "none",
    resize: "vertical",
    minHeight: "120px",
  },
  submitButton: {
    background: "linear-gradient(135deg, #1abc9c, #16a085)",
    color: "white",
    padding: "20px 35px", /* 패딩 증가 */
    border: "none",
    borderRadius: "25px",
    fontSize: "1.3rem", /* 18px 전후로 증가 */
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 25px rgba(26, 188, 156, 0.3)",
    position: "relative",
    overflow: "hidden",
  },

  // 호버 효과
  cardHover: {
    transform: "translateY(-5px) scale(1.02)",
    boxShadow: "0 20px 60px rgba(26, 188, 156, 0.2)",
    borderColor: "rgba(26, 188, 156, 0.3)",
  },
  inputFocus: {
    borderColor: "#1abc9c",
    boxShadow: "0 0 0 3px rgba(26, 188, 156, 0.1)",
    background: "white",
  },
  buttonHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 35px rgba(26, 188, 156, 0.4)",
  },
};

// CSS 애니메이션 및 호버 효과 추가
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  .card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 20px 60px rgba(26, 188, 156, 0.2);
    border-color: rgba(26, 188, 156, 0.3);
  }
  
  .form-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 60px rgba(26, 188, 156, 0.2);
  }
  
  input:focus, textarea:focus {
    border-color: #1abc9c !important;
    box-shadow: 0 0 0 3px rgba(26, 188, 156, 0.1) !important;
    background: white !important;
  }
  
  button:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(26, 188, 156, 0.4);
  }
  
  @media (max-width: 768px) {
    .two-column-grid {
      grid-template-columns: 1fr;
      gap: 30px;
    }
    
    .form-card {
      position: static;
    }
    
    .page-title {
      font-size: 2.4rem; /* 모바일에서도 22-24px 이상 유지 */
    }
    
    .page-subtitle {
      font-size: 1.2rem; /* 모바일에서도 18px 전후 유지 */
    }
    
    .card-title {
      font-size: 1.6rem; /* 모바일에서도 18px 전후 유지 */
    }
    
    .card-description {
      font-size: 1.1rem; /* 모바일에서도 16px 이상 유지 */
    }
    
    .form-title {
      font-size: 2rem; /* 모바일에서도 20px 이상 유지 */
    }
    
    .label {
      font-size: 1.1rem; /* 모바일에서도 16px 이상 유지 */
    }
    
    .input, .textarea {
      font-size: 1.1rem; /* 모바일에서도 16px 이상 유지 */
    }
    
    .submit-button {
      font-size: 1.2rem; /* 모바일에서도 18px 전후 유지 */
    }
  }
  
  @media (max-width: 480px) {
    .page-title {
      font-size: 2rem; /* 작은 화면에서도 20px 이상 유지 */
    }
    
    .page-subtitle {
      font-size: 1.1rem; /* 작은 화면에서도 16px 이상 유지 */
    }
    
    .card-title {
      font-size: 1.4rem; /* 작은 화면에서도 16px 이상 유지 */
    }
    
    .form-title {
      font-size: 1.8rem; /* 작은 화면에서도 18px 전후 유지 */
    }
  }
`;
document.head.appendChild(styleSheet);

export default Contact;
