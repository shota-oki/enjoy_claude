import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { Dialog } from "./components/Dialog";
import { msg } from "./constants/messages";
import { initialize } from "./services/appInitializer";
import { updateService } from "./services/updateService";
import "./styles/global.css";
import { logger } from "./utils/logger";

const root = createRoot(document.getElementById("root")!);

async function start() {
  // 起動時処理（P-01）を終えてから画面を表示する
  const initial = await initialize();

  // npm run seed:sample のときだけ確認用データを作る（本番ビルドには含まれない）
  if (import.meta.env.MODE === "sample") {
    const { seedSampleData } = await import("./dev/sampleData");
    await seedSampleData((text) =>
      root.render(<p className="sample-progress">{text}</p>),
    );
  }

  root.render(
    <StrictMode>
      <App initial={initial} />
    </StrictMode>,
  );

  // 新しい版の確認（M-01 4章）。開発サーバーでは Service Worker を使わない
  if (import.meta.env.PROD) updateService.start(registerSW);
}

start().catch((error: unknown) => {
  logger.error("起動処理に失敗しました", error);
  // DBを開けない場合は MSG-E12 を表示する
  root.render(
    <div className="app-frame">
      <Dialog
        title={msg("MSG-E12")}
        buttons={[
          {
            label: "OK",
            style: "bold",
            onClick: () => window.location.reload(),
          },
        ]}
      />
    </div>,
  );
});
