import { redirect } from 'next/navigation';

export default function OldClientManagementPage() {
    redirect('/admin/client-management');
    return null;
}
