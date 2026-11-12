import { redirect } from 'next/navigation'
export default function KioskPage({ searchParams }: { searchParams: { token?: string } }) {
  redirect(searchParams.token ? `/device?token=${searchParams.token}` : '/device')
}
