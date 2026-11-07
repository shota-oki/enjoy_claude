import { useNavigate } from "react-router-dom";
import { NavBar, NavButton } from "../components/NavBar";

// 次の区切りで実装する画面の仮置き（SC-04〜SC-08）
export function PlaceholderScreen({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div className="screen">
      <NavBar
        title={title}
        left={<NavButton label="戻る" back onClick={() => navigate(-1)} />}
      />
      <div className="screen-content">
        <p style={{ textAlign: "center", color: "var(--sub)", padding: 40 }}>
          この画面は次の区切りで実装します
        </p>
      </div>
    </div>
  );
}
