export { ToastProvider } from "./ToastProvider";
export type { ToastProviderProps } from "./ToastProvider";

// toast 함수를 re-export — 소비자가 동일 인스턴스를 쓰도록.
// (react-hot-toast가 중복 번들되면 toast 큐 싱글톤이 갈라져 토스트가 안 뜨는 문제 방지)
export { default as toast } from "react-hot-toast";
