import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Dialog } from "./components/Dialog";
import { msg } from "./constants/messages";
import { initialize } from "./services/appInitializer";
import "./styles/global.css";
import { logger } from "./utils/logger";

const root = createRoot(document.getElementById("root")!);

// 起動時処理（P-01）を終えてから画面を表示する
initialize()
  .then((initial) => {
    root.render(
      <StrictMode>
        <App initial={initial} />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
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
