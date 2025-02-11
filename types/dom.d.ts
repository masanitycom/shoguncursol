interface HTMLInputElement extends HTMLElement {
    name: string;
    value: string;
}

interface HTMLSelectElement extends HTMLElement {
    name: string;
    value: string;
}

export interface CustomDocument extends Document {
    createElement(tagName: 'a'): HTMLAnchorElement;
    createElement(tagName: string): HTMLElement;
}

export interface CustomWindow extends Window {
    URL: {
        createObjectURL(blob: Blob): string;
        revokeObjectURL(url: string): void;
    };
} 