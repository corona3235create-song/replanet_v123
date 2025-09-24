import React, { useState } from "react";
import PageHeader from "../components/PageHeader";

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  date: string;
}

const Notice: React.FC = () => {
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  // 여러 개 공지사항 데이터
  const notices: NoticeItem[] = [
    {
      id: 1,
      title: "🌱 데모 버전 안내 - 임의 사용자 데이터 사용",
      content:
        "본 웹 서비스는 현재 데모 버전으로, 임의의 사용자 데이터를 생성하여 서비스를 체험할 수 있도록 구성되었습니다.\n\n" +
        "• 사용자명: 김에코\n" +
        "• 초기 크레딧: 1,240C\n" +
        "• 탄소 절감량: 18.5kg\n" +
        "• 정원 레벨: Lv.1\n\n" +
        "이 페르소나는 데모 버전의 완성도를 높이기 위해 설정된 것으로, 모든 탭과 서비스에서 실시간으로 연동되어 작동합니다.\n" +
        "실제 서비스 출시 시에는 개인별 맞춤 데이터로 제공될 예정입니다.",
      date: "2025-09-17",
    },
    {
      id: 2,
      title: "2025 서울 AI 해커톤 데모버전입니다",
      content:
        "이 프로젝트는 2025 서울 AI 해커톤을 위해 제작된 데모 버전입니다.\n기능은 일부 제한되어 있으며, 실제 서비스와 다를 수 있습니다.",
      date: "2025-09-15",
    },
    {
      id: 3,
      title: "서비스 체험 이벤트 안내",
      content:
        "Ecoo 챗봇과 대시보드를 통해 탄소 절감 활동을 체험하세요!\n참여자에게는 추가 크레딧이 지급됩니다.",
      date: "2025-09-20",
    },
    {
      id: 4,
      title: "업데이트 예정 사항",
      content:
        "곧 사용자별 맞춤형 추천 기능과 정원 꾸미기 기능이 추가될 예정입니다.\n많은 기대 부탁드립니다!",
      date: "2025-09-25",
    },
  ];

  return (
    <div style={styles.page}>
      <PageHeader 
        title="공지사항" 
        subtitle="Ecoo의 최신 소식과 업데이트를 확인하세요"
        icon="📢"
      />
      <div style={styles.container}>

        {/* 공지 목록 */}
        <ul style={styles.noticeList}>
          {notices.map((notice) => (
            <li
              key={notice.id}
              style={styles.noticeItem}
              onClick={() => setSelectedNotice(notice)}
            >
              <span style={styles.noticeTitle}>{notice.title}</span>
              <span style={styles.noticeDate}>{notice.date}</span>
            </li>
          ))}
        </ul>

        {/* 선택된 공지 상세보기 */}
        {selectedNotice && (
          <div style={styles.noticeDetail}>
            <h3 style={styles.detailTitle}>{selectedNotice.title}</h3>
            <p style={styles.detailDate}>{selectedNotice.date}</p>
            <pre style={styles.detailContent}>{selectedNotice.content}</pre>
            <button
              style={styles.closeButton}
              onClick={() => setSelectedNotice(null)}
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    backgroundColor: "#ffffff",
    padding: "100px 20px",
    fontFamily: "'Pretendard', sans-serif",
    minHeight: "100vh",
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "#1abc9c",
    marginBottom: "30px",
    textAlign: "center",
  },
  noticeList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    borderTop: "2px solid #1abc9c",
  },
  noticeItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 20px",
    borderBottom: "1px solid #ecf0f1",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  noticeTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#34495e",
  },
  noticeDate: {
    fontSize: "0.9rem",
    color: "#7f8c8d",
  },
  noticeDetail: {
    marginTop: "30px",
    padding: "20px",
    border: "1px solid #ecf0f1",
    borderRadius: "10px",
    backgroundColor: "#f9f9f9",
  },
  detailTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "10px",
    color: "#34495e",
  },
  detailDate: {
    fontSize: "0.9rem",
    color: "#7f8c8d",
    marginBottom: "20px",
  },
  detailContent: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    fontSize: "1rem",
    marginBottom: "20px",
  },
  closeButton: {
    backgroundColor: "#1abc9c",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};

export default Notice;
