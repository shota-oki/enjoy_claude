import { ActionSheet } from "../../components/ActionSheet";
import { SORT_ORDERS, type SortOrderId } from "../../constants/sortOrders";

// SC-03 並び替え
interface Props {
  current: SortOrderId;
  onSelect: (order: SortOrderId) => void;
  onCancel: () => void;
}

export function SortSheet({ current, onSelect, onCancel }: Props) {
  return (
    <ActionSheet
      title="並び替え"
      options={SORT_ORDERS.map((order) => ({
        label: order.name,
        checked: order.id === current,
        onSelect: () => onSelect(order.id),
      }))}
      onCancel={onCancel}
    />
  );
}
