// Placeholder — real implementation added in M17
import type { TransportProvider, TransportBookingRequest } from '../interfaces/TransportProvider'

export class LyftTransportProvider implements TransportProvider {
  async bookRide(_req: TransportBookingRequest): Promise<{ bookingId: string; estimatedArrival?: string }> {
    throw new Error('[LyftTransportProvider] Not yet implemented — add in M17')
  }
  async cancelRide(_bookingId: string): Promise<void> {
    throw new Error('[LyftTransportProvider] Not yet implemented — add in M17')
  }
  async getRideStatus(_bookingId: string): Promise<string> {
    throw new Error('[LyftTransportProvider] Not yet implemented — add in M17')
  }
}
