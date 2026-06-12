import { createContext } from "react";

/**
 * SearchBox 모바일 바텀시트 내부 여부를 자식에게 알리는 컨텍스트.
 *
 * 자식 컴포넌트(예: SearchBoxDateRange)가 자체 popover/시트를 띄울 때, 부모 바텀시트가
 * 이미 떠 있는지 알아야 한다. 떠 있으면 시트 두 개가 겹치는 어색함을 피하기 위해
 * ModalSubView(drawer 변형)로 분기.
 */
export const SearchBoxSheetContext = createContext<boolean>(false);
