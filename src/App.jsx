import { useState, useEffect, useRef } from "react";

const WS_URL = "ws://192.168.1.103:8000/ws";
const API_URL = "http://192.168.1.103:8000";

function formatDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return month + "/" + day + " " + hour + ":" + min;
}

function getFilename(path) {
  if (!path) return null;
  return path.split("/").pop();
}

function App() {
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [faces, setFaces] = useState([]);
  const [frame, setFrame] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const wsRef = useRef(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch(API_URL + "/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (e) {}
  };

  const fetchFaces = async () => {
    try {
      const res = await fetch(API_URL + "/api/faces");
      const data = await res.json();
      setFaces(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchEvents();
    fetchFaces();
    const interval = setInterval(() => {
      fetchEvents();
      fetchFaces();
    }, 5000);

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "frame") {
          setFrame(data.image);
          setStatus(data.status);
        }
      };
      ws.onclose = () => { setTimeout(connect, 1000); };
    };
    connect();

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const cardStyle = (bg) => ({
    flex: 1, padding: 14, borderRadius: 10,
    background: bg, color: "white", minWidth: 120, textAlign: "center"
  });

  const tabStyle = (active) => ({
    padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
    background: active ? "#1A1A2E" : "#E2E8F0",
    color: active ? "white" : "#475569",
    fontWeight: active ? "700" : "400", fontSize: 14
  });

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <h1 style={{ color: "#1A1A2E", marginBottom: 16 }}>🚪 DoorGuard 대시보드</h1>

      {/* 상태 카드 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={cardStyle(status && status.pir_detected ? "#ffa502" : "#747d8c")}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>PIR 센서</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>
            {status && status.pir_detected ? "움직임!" : "대기"}
          </div>
        </div>
        <div style={cardStyle(status && status.person_detected ? "#ff4757" : "#2ed573")}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>사람 감지</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>
            {status && status.person_detected ? "감지됨!" : "안전"}
          </div>
        </div>
        <div style={cardStyle(status && status.is_recording ? "#ff6b35" : "#747d8c")}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>녹화 상태</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>
            {status && status.is_recording ? "녹화 중" : "대기"}
          </div>
        </div>
        <div style={cardStyle("#3742fa")}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>체류 시간</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>
            {status ? status.duration : 0}초
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={tabStyle(tab === "dashboard")} onClick={() => setTab("dashboard")}>📷 실시간</button>
        <button style={tabStyle(tab === "events")} onClick={() => setTab("events")}>📋 감지 이력</button>
        <button style={tabStyle(tab === "faces")} onClick={() => setTab("faces")}>👤 인물 관리</button>
      </div>

      {/* 실시간 탭 */}
      {tab === "dashboard" && (
        <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", textAlign: "center", marginBottom: 16 }}>
          {frame
            ? <img src={"data:image/jpeg;base64," + frame} style={{ width: "100%", maxHeight: 420, objectFit: "contain" }} alt="camera" />
            : <div style={{ padding: 60, color: "#fff" }}>카메라 연결 중...</div>
          }
        </div>
      )}

      {/* 감지 이력 탭 */}
      {tab === "events" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: "bold", color: "#1A1A2E" }}>감지 이력</span>
            <button onClick={fetchEvents} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#3742fa", color: "white", cursor: "pointer", fontSize: 13 }}>새로고침</button>
          </div>
          {events.length === 0
            ? <div style={{ padding: 20, background: "#f1f5f9", borderRadius: 10, textAlign: "center", color: "#94A3B8" }}>감지된 이벤트가 없어요</div>
            : events.map(function(e) {
                const filename = getFilename(e.clip_path);
                const clipUrl = filename ? API_URL + "/api/clips/" + filename : null;
                const snapFilename = getFilename(e.snapshot_path);
                const snapUrl = snapFilename ? API_URL + "/api/snapshots/" + snapFilename : null;
                return (
                  <div key={e.id} style={{ padding: 14, marginBottom: 8, background: "#f8fafc", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      {snapUrl && (
                        <img src={snapUrl} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="snap" />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: 14, color: "#1e293b", marginBottom: 3 }}>
                          {e.event_type === "door_open" ? "🚪 문 열림" : "🚨 사람 감지"}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                          {formatDate(e.timestamp)} · {e.duration_sec ? e.duration_sec.toFixed(1) : 0}초
                        </div>
                        {clipUrl && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <a href={clipUrl} target="_blank" rel="noopener noreferrer"
                              style={{ padding: "4px 12px", borderRadius: 5, background: "#3742fa", color: "white", textDecoration: "none", fontSize: 12 }}>
                              ▶ 재생
                            </a>
                            <a href={clipUrl} download={filename}
                              style={{ padding: "4px 12px", borderRadius: 5, background: "#2ed573", color: "white", textDecoration: "none", fontSize: 12 }}>
                              ⬇ 다운
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* 인물 관리 탭 */}
      {tab === "faces" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: "bold", color: "#1A1A2E" }}>등록된 인물 ({faces.length}명)</span>
            <button onClick={fetchFaces} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#3742fa", color: "white", cursor: "pointer", fontSize: 13 }}>새로고침</button>
          </div>
          {faces.length === 0
            ? <div style={{ padding: 20, background: "#f1f5f9", borderRadius: 10, textAlign: "center", color: "#94A3B8" }}>등록된 인물이 없어요</div>
            : faces.map(function(f) {
                const faceFolder = f.face_image_path;
                const faceImgUrl = faceFolder
                  ? API_URL + "/api/face_image/" + encodeURIComponent(faceFolder)
                  : null;
                return (
                  <div key={f.id} style={{ padding: 14, marginBottom: 8, background: "#f8fafc", borderRadius: 10, border: "1px solid #E2E8F0", display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: "#1A1A2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 28 }}>👤</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: 15, color: "#1e293b", marginBottom: 4 }}>인물 #{f.id}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>첫 출현: {formatDate(f.first_seen)}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>마지막 출현: {formatDate(f.last_seen)}</div>
                      <div style={{ fontSize: 12, color: "#0D9488", fontWeight: "600" }}>총 {f.visit_count}회 출현</div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

export default App;