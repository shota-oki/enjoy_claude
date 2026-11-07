import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../src/App";
import type { SortOrderId } from "../src/constants/sortOrders";
import { ListStateProvider } from "../src/state/ListStateContext";
import { UiProvider } from "../src/state/UiContext";

interface Options {
  path?: string;
  sortOrder?: SortOrderId;
  showInstallBanner?: boolean;
}

/** アプリ全体を指定した画面から表示する（結合テスト用） */
export function renderApp({
  path = "/",
  sortOrder = "created_desc",
  showInstallBanner = false,
}: Options = {}) {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <UiProvider>
        <ListStateProvider
          initialSortOrder={sortOrder}
          showInstallBanner={showInstallBanner}
        >
          <AppRoutes />
        </ListStateProvider>
      </UiProvider>
    </MemoryRouter>,
  );
  return { user, ...result };
}
