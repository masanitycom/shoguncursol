import { Metadata } from 'next'

// メタデータをここで定義
export const metadata: Metadata = {
    title: '管理画面',
    description: 'Shogun Trade System 管理画面',
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="admin-layout">
            {children}
        </div>
    )
} 