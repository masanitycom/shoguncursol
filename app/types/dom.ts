export interface CustomDocument extends Document {
    documentMode?: any;
}

export interface CustomWindow extends Window {
    FileReader?: typeof FileReader;
    URL: typeof URL;
}

// カスタムイベントの型定義
export interface CustomEvent extends Event {
    detail?: any;
}

// カスタムイベントターゲットの型定義
export interface CustomEventTarget extends EventTarget {
    addEventListener(type: string, listener: (event: CustomEvent) => void): void;
}

// カスタムアンカー要素の型定義
export type CustomAnchorElement = HTMLAnchorElement;

// 型ガード関数
export function isCustomWindow(window: Window): window is CustomWindow {
    return 'URL' in window && 'FileReader' in window;
}

export function isCustomAnchor(element: HTMLElement): element is HTMLAnchorElement {
    return element instanceof HTMLAnchorElement;
} 