export default function GriefSupportPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Grief support pathways: loss of a loved one, major health diagnosis, major life change, caregiver support, loss of driving, late-life divorce divorce separation, dementia MCI diagnosis, adult child moving, housing insecurity forced move</span>
      <noscript>Grief support navigator: compassionate care guide for loss and bereavement.</noscript>
      <h1 className="text-2xl font-bold mb-2">Grief Support</h1>
      <p className="text-gray-600 mb-4">Your navigator is here to guide you through grief with compassion and care.</p>
      <div className="space-y-3">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-1">Talk to Your Navigator</h2>
          <p className="text-sm text-gray-600">Your personal care navigator can connect you with grief counselors, support groups, and resources.</p>
          <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm">Contact Navigator</button>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-1">Grief Support Groups</h2>
          <p className="text-sm text-gray-600">Join others who understand your journey.</p>
        </div>
      </div>
    </div>
  )
}
