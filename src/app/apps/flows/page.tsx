import { redirect } from 'next/navigation';

// Redirect to the main flows management page
export default function FlowsPage() {
  redirect('/flows');
}
