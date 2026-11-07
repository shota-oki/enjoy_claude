import {
  HashRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
} from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalOverlays } from "./components/GlobalOverlays";
import { TabBar } from "./components/TabBar";
import { ItemListScreen } from "./screens/ItemListScreen/ItemListScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import type { InitialState } from "./services/appInitializer";
import { ListStateProvider } from "./state/ListStateContext";
import { UiProvider } from "./state/UiContext";

// 画面遷移の定義（処理設計書 共通 6章）と共通レイアウト
export function App({ initial }: { initial: InitialState }) {
  return (
    <HashRouter>
      <UiProvider>
        <ListStateProvider
          initialSortOrder={initial.sortOrder}
          showInstallBanner={initial.showInstallBanner}
        >
          <AppRoutes />
        </ListStateProvider>
      </UiProvider>
    </HashRouter>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ItemListScreen />} />
        <Route
          path="/items/new"
          element={<PlaceholderScreen title="アイテム登録" />}
        />
        <Route
          path="/items/:itemId"
          element={<PlaceholderScreen title="アイテム詳細" />}
        />
        <Route
          path="/items/:itemId/edit"
          element={<PlaceholderScreen title="アイテム編集" />}
        />
        <Route path="/settings" element={<PlaceholderScreen title="設定" />} />
        <Route
          path="/settings/subcategories"
          element={<PlaceholderScreen title="サブカテゴリ管理" />}
        />
        <Route
          path="/settings/subcategories/:categoryId"
          element={<PlaceholderScreen title="サブカテゴリ編集" />}
        />
        {/* 存在しないURLは SC-01 へ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  // SC-05（登録・編集）ではタブバーを表示しない
  const isNew = useMatch("/items/new");
  const isEdit = useMatch("/items/:itemId/edit");
  const isForm = isNew !== null || isEdit !== null;
  return (
    <div className="app-frame">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      {!isForm && <TabBar />}
      <GlobalOverlays />
    </div>
  );
}
