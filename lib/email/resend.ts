import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrgEnrollmentAlert({
  orgName, orgType, contactName, contactEmail, orgId,
}: {
  orgName: string; orgType: string; contactName: string
  contactEmail: string; orgId: string
}) {
  return resend.emails.send({
    from: 'ThriveAtHome <noreply@thriveatHome.com>',
    to: ['admin@thriveatHome.com'],
    subject: `New org enrolled: ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#0a2342">New Organization Enrolled 🎉</h2>
        <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
          <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600;width:140px">Org Name</td><td style="padding:10px 12px;border-bottom:1px solid #eee">${orgName}</td></tr>
          <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600">Org Type</td><td style="padding:10px 12px;border-bottom:1px solid #eee">${orgType.replace(/_/g, ' ')}</td></tr>
          <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600">Contact</td><td style="padding:10px 12px;border-bottom:1px solid #eee">${contactName}</td></tr>
          <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600">Email</td><td style="padding:10px 12px;border-bottom:1px solid #eee">${contactEmail}</td></tr>
          <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600">Org ID</td><td style="padding:10px 12px;font-size:12px;color:#666">${orgId}</td></tr>
        </table>
        <p style="color:#555">Next step: send partnerships intro email within 24 hours.</p>
        <a href="https://thriveatHome.com/admin/orgs/${orgId}"
           style="display:inline-block;background:#008b82;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          View in admin portal →
        </a>
      </div>
    `,
  })
}
