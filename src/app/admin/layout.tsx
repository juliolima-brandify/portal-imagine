'use client'

import { memo } from 'react'
import UnifiedLayout from '@/components/UnifiedLayout'

const AdminLayout = memo(function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UnifiedLayout
      variant="admin"
      user={{
        name: 'Admin Demo',
        email: 'admin@institutoimagine.org',
        role: 'admin'
      }}
    >
      {children}
    </UnifiedLayout>
  )
})

export default AdminLayout