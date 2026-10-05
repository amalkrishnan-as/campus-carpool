// Frontend types matching the backend schemas

export interface User {
  id: string;
  name: string;
  email: string;
  college_id?: string;
  department?: string;
  year?: number;
  phone?: string;
  profile_image_url?: string;
  role: 'USER' | 'ADMIN';
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  average_rating: number;
  rating_count: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  type: string;
  model: string;
  registration_number: string;
  seat_capacity: number;
  created_at: string;
}

export type RideStatus = 'OPEN' | 'FULL' | 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface Ride {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  source: string;
  destination: string;
  pickup_point: string;
  departure_date: string;
  departure_time: string;
  original_seats: number;
  available_seats: number;
  contribution: string;
  notes?: string;
  status: RideStatus;
  created_at: string;
  driver?: {
    id: string;
    name: string;
    average_rating: number;
    rating_count: number;
    department?: string;
    profile_image_url?: string;
  };
  vehicle?: Vehicle;
}

export interface RideRequest {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  passenger?: {
    id: string;
    name: string;
    average_rating: number;
    department?: string;
  };
  ride?: Ride;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  ride_id?: string;
  request_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  ride_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  total_rides: number;
  active_rides: number;
  completed_rides: number;
  total_requests: number;
  accepted_requests: number;
  open_reports: number;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  ride_id?: string;
  reason: string;
  description?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}
