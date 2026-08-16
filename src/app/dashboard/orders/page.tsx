'use client'
import { redirect } from 'next/navigation'

// Redirect to the combined sales page
export default function OrdersRedirect() {
  redirect('/dashboard/sales')
}
