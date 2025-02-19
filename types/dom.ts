// カスタムウィンドウインターフェース
export interface CustomWindow extends Window {
    webkitRequestFileSystem?: any;
    requestFileSystem?: any;
    webkitResolveLocalFileSystemURL?: any;
    resolveLocalFileSystemURL?: any;
    URL: typeof URL;
}

// カスタムアンカーインターフェース
export interface CustomAnchor extends Partial<HTMLAnchorElement> {
    download?: string;
    href?: string;
    click?: () => void;
}

// カスタムドキュメントインターフェース
export interface CustomDocument extends Document {
    createElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K];
    createElement(tagName: string): HTMLElement;
}

// カスタムイベントインターフェース
export interface CustomEvent extends Event {
    initEvent(type: string, bubbles: boolean, cancelable: boolean): void;
}

export interface FileWithPath extends File {
    path?: string;
}

export interface DragEvent extends React.DragEvent<HTMLDivElement> {
    dataTransfer: DataTransfer & {
        items: DataTransferItemList & {
            [index: number]: DataTransferItem & {
                webkitGetAsEntry(): FileSystemEntry;
            };
        };
    };
}

// 型ガード関数
export const isCustomWindow = (obj: any): obj is CustomWindow => {
    return typeof window !== 'undefined' && obj === window;
};

export const isCustomDocument = (obj: any): obj is CustomDocument => {
    return typeof document !== 'undefined' && obj === document;
};

export const isCustomAnchor = (obj: any): obj is CustomAnchor => {
    return obj instanceof HTMLAnchorElement;
}; 