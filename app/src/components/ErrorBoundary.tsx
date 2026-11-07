import { Component, type ReactNode } from "react";
import { msg } from "../constants/messages";
import { logger } from "../utils/logger";
import { Dialog } from "./Dialog";

// 共通のエラー境界（処理設計書 共通 9章）。
// 読み込みの失敗や想定外の例外は MSG-E12 を表示する
interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    logger.error("想定外のエラーが発生しました", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <Dialog
          title={msg("MSG-E12")}
          buttons={[
            {
              label: "OK",
              style: "bold",
              onClick: () => this.setState({ failed: false }),
            },
          ]}
        />
      );
    }
    return this.props.children;
  }
}
