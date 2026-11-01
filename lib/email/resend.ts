import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrgEnrollmentAlert({
  orgName,
  orgType,
  contactName,
  contactEmail,
  orgId,
}: {
  orgName: string
  orgType: string
  contactName: string
  contactEmail: string
  orgId: string
}) {
  return resend.emails.send({
    from: 'ThriveAtHome <noreply@thriveatHome.com>',
    to: ['admin@thriveatHome.com'],   // ← change to your real team inbox
    subject: `New org enrolled: ${orgName}`,
    html: `
      <h2>New Organization Enrolled 🎉</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold">Org Name</td><td style="padding:8px">${orgName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Org Type</td><td style="padding:8px">${orgType}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Contact</td><td style="padding:8px">${contactName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${contactEmail}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Org ID</td><td style="padding:8px">${orgId}</td></tr>
      </table>
      <p><a href="https://thriveatHome.com/admin/orgs/${orgId}">View in admin portal →</a></p>
    `,
  })
}
