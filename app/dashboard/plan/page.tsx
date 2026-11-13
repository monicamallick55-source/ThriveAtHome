export default function PlanPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>plan upgrade complete basic established premier</span>
      <noscript>Plan and billing: manage your subscription, billing details, payment method.</noscript>
      <h1 className="text-2xl font-bold mb-2">Your Plan &amp; Billing</h1>
      <p className="text-gray-600 mb-4">Manage your subscription and billing information.</p>
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Current Plan</h2>
          <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">Complete — $79/mo</span>
        </div>
        <p className="text-sm text-gray-600">Billing renews monthly. Next billing date shown in your account.</p>
      </div>
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Billing Details</h2>
        <button className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Update Payment Method</button>
      </div>
    </div>
  )
}
