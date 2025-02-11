"use client"

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="es2015" />
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// 型定義
interface BackupData {
    data: {
        [key: string]: any;
    };
    error: any;
}

// カスタムDOM型定義
interface CustomDocument extends Document {
    createElement(tagName: 'a'): HTMLAnchorElement;
    createElement(tagName: string): HTMLElement;
    body: HTMLElement & {
        appendChild(node: HTMLElement): void;
        removeChild(node: HTMLElement): void;
    };
}

interface CustomWindow extends Window {
    URL: {
        createObjectURL(blob: Blob): string;
        revokeObjectURL(url: string): void;
    };
}

declare const document: CustomDocument;
declare const window: CustomWindow;

interface HTMLElementWithStyle extends HTMLElement {
    style: CSSStyleDeclaration;
}

interface CustomAnchor extends HTMLAnchorElement {
    href: string;
    download: string;
    click(): void;
}

// named exportに変更
export function BackupButton() {
    const [loading, setLoading] = useState(false)

    const downloadFile = (data: any, filename: string) => {
        if (typeof window === 'undefined') return

        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a') as CustomAnchor
            
            link.href = url
            link.download = filename
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download error:', error)
        }
    }

    const handleBackup = async () => {
        setLoading(true)
        try {
            const result = await supabase.rpc('backup_data') as BackupData

            if (result.error) throw result.error

            downloadFile(
                result.data, 
                `backup_${new Date().toISOString()}.json`
            )

        } catch (error) {
            console.error('Backup error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleBackup}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
            {loading ? 'バックアップ中...' : 'バックアップ'}
        </button>
    )
} 