import { useState, useEffect } from "react";

const API_URL = "https://ebooks-charging-according-tutorials.trycloudflare.com";

function App() {
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [frame, setFrame] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/status`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {}
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
    } catch (e) {}
  };

  const fetchFrame = async () => {
    try {
      const res = await fetch(`${API_URL}/api/frame`);
      const data = await res.json();
      if (data.image) setFrame(data.image);
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    fetchEvents();
    fetchFrame();
    const interval = setInterval(() => {
      fetchStatus();
      fetchFrame();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1 style={{ color: "#1a1a2e" }}>🚪 DoorGuard 대시보드</h1>

      {/* 상태 카드 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, padding: 20, borderRadius: 12, background: status?.person_detected ? "#ff4757" : "#2ed573", color: "white" }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>감지 상태</div>
          <div style={{ fontSize: 24, fontWeight: "bold" }}>
            {status?.person_detected ? "🚨 사람 감지됨!" : "✅ 안전"}
          </div>
        </div>
        <div style={{ flex: 1, padding: 20, borderRadius: 12, background: status?.is_recording ? "#ff6b35" : "#747d8c", color: "white" }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>녹화 상태</div>
          <div style={{ fontSize: 24, fontWeight: "bold" }}>
            {status?.is_recording ? "🔴 녹화 중" : "⬜ 대기 중"}
          </div>
        </div>
        <div style={{ flex: 1, padding: 20, borderRadius: 12, background: "#3742fa", color: "white" }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>체류 시간</div>
          <div style={{ fontSize: 24, fontWeight: "bold" }}>
            {status?.duration || 0}초
          </div>
        </div>
      </div>

      {/* 실시간 카메라 */}
      <div style={{ marginBottom: 24 }}>
        <h2>📷 실시간 현관 영상</h2>
        <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", textAlign: "center" }}>
          {frame ? (
            <img src={`data:image/jpeg;base64,${frame}`} style={{ width: "100%", maxHeight: 400, objectFit: "contain" }} alt="camera" />
          ) : (
            <div style={{ padding: 40, color: "#fff" }}>카메라 로딩 중...</div>
          )}
        </div>
      </div>

      {/* 감지 이력 */}
      <div>
        <h2>📋 감지 이력</h2>
        <button onClick={fetchEvents} style={{ marginBottom: 12, padding: "8px 16px", borderRadius: 8, border: "none", background: "#3742fa", color: "white", cursor: "pointer" }}>
          새로고침
        </button>
        {events.length === 0 ? (
          <div style={{ padding: 20, background: "#f1f2f6", borderRadius: 12, textAlign: "center", color: "#747d8c" }}>
            감지된 이벤트가 없어요
          </div>
        ) : (
          events.map((e) => (
            <div key={e.id} style={{ padding: 16, marginBottom: 8, background: "#f1f2f6", borderRadius: 12, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "bold" }}>🚨 배회 감지</div>
                <div style={{ fontSize: 13, color: "#747d8c" }}>{e.timestamp}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "bold" }}>{e.duration_sec?.toFixed(1)}초</div>
                <div style={{ fontSize: 13, color: "#747d8c" }}>체류 시간</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;