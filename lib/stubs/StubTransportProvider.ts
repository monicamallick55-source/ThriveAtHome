// Stub implementation — logs transport bookings, no real rides. Replaced in M17 with LyftTransportProvider.
import type { TransportProvider, TransportBookingRequest } from '../interfaces/TransportProvider'

export class StubTransportProvider implements TransportProvider {
  async bookRide(req: TransportBookingRequest): Promise<{ bookingId: string; estimatedArrival?: string }> {
    console.log(`[STUB][Transport] Would book ride for member: ${req.memberId} from ${req.pickupAddress}`)
    return { bookingId: `stub-ride-${Date.now()}`, estimatedArrival: '15 minutes' }
  }
  async cancelRide(bookingId: string): Promise<void> {
    console.log(`[STUB][Transport] Would cancel ride: ${bookingId}`)
  }
  async getRideStatus(bookingId: string): Promise<string> {
    console.log(`[STUB][Transport] Would get status for ride: ${bookingId}`)
    return 'confirmed'
  }
}
