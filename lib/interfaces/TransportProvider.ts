// Interface for booking and managing transport rides for members.

export interface TransportBookingRequest {
  memberId: string
  pickupAddress: string
  destinationAddress: string
  requestedDate: string
  requestedTime: string
  tripType: string
  isRecurring: boolean
}

export interface TransportProvider {
  bookRide(req: TransportBookingRequest): Promise<{ bookingId: string; estimatedArrival?: string }>
  cancelRide(bookingId: string): Promise<void>
  getRideStatus(bookingId: string): Promise<string>
}
