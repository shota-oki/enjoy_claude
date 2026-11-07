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
import { UpdateBanner } from "./components/UpdateBanner";
import { ItemDetailScreen } from "./screens/ItemDetailScreen/ItemDetailScreen";
import { ItemFormScreen } from "./screens/ItemFormScreen/ItemFormScreen";
import { ItemListScreen } from "./screens/ItemListScreen/ItemListScreen";
import { CategorySelectScreen } from "./screens/CategorySelectScreen/CategorySelectScreen";
import { SettingsScreen } from "./screens/SettingsScreen/SettingsScreen";
import { SubcategoryEditScreen } from "./screens/SubcategoryEditScreen/SubcategoryEditScreen";
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
        <Route path="/items/new" element={<ItemFormScreen />} />
        <Route path="/items/:itemId" element={<ItemDetailScreen />} />
        <Route
          path="/items/:itemId/edit"
          element={<ItemFormScreen key="edit" />}
        />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route
          path="/settings/subcategories"
          element={<CategorySelectScreen />}
        />
        <Route
          path="/settings/subcategories/:categoryId"
          element={<SubcategoryEditScreen />}
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
      {/* 更新の案内は SC-05 の表示中は出さず、閉じたあとに表示する（M-01 4.3） */}
      {!isForm && <UpdateBanner />}
      {!isForm && <TabBar />}
      <GlobalOverlays />
    </div>
  );
}
