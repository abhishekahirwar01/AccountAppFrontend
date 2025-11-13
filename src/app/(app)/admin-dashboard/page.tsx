import { redirect } from 'next/navigation';

export default function OldAdminDashboardPage() {
  redirect('/admin/dashboard');
  return null;
}
