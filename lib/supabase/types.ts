export type SensorType = 'infrasound' | 'seismic' | 'pressure' | 'weather'
export type QualityFlag = 'good' | 'noisy' | 'suspicious'
export type DbEventType = 'meteor_candidate' | 'earthquake_candidate' | 'noise'
export type DbEventStatus = 'pending' | 'confirmed' | 'rejected'
export type ClassificationLabel = 'meteor' | 'earthquake' | 'explosion' | 'construction' | 'noise'

// NOTE: Row/Insert/Update shapes must be `type` aliases (not `interface`s) so
// TypeScript grants them implicit index signatures. supabase-js >= 2.100 checks
// each table against `Record<string, unknown>` when resolving the schema
// generic; interfaces fail that check and collapse the whole schema to `never`.
export type UsersDevice = {
  device_id: string
  user_id: string | null
  device_type: string | null
  sensor_types: string[] | null
  lat: number
  lon: number
  altitude: number | null
  accuracy_m: number | null
  os: string | null
  app_version: string | null
  last_seen: string | null
}

export type SensorReading = {
  reading_id: string
  device_id: string
  timestamp_utc: string
  sensor_type: SensorType
  value: number
  unit: string
  sampling_rate_hz: number
  quality_flag: QualityFlag
}

export type EventRow = {
  event_id: string
  start_time_utc: string
  end_time_utc: string | null
  event_type: DbEventType
  confidence: number
  status: DbEventStatus
  region: string | null
  created_at: string
}

export type EventDetection = {
  detection_id: string
  event_id: string
  device_id: string
  arrival_time_utc: string
  peak_amplitude: number
  dominant_frequency_hz: number
  duration_s: number
  snr: number
  back_azimuth_deg: number | null
  distance_km: number | null
}

export type SignalFeature = {
  event_id: string
  device_id: string
  fft_peak_hz: number
  band_energy_0_1hz: number
  band_energy_1_5hz: number
  band_energy_5_20hz: number
  n_wave_detected: boolean
  spectral_centroid: number
  waveform_duration_s: number
}

export type ClassificationRow = {
  classification_id: string
  event_id: string
  label: ClassificationLabel
  probability: number
  model_version: string
  rules_triggered: string[]
  explanation: string
}

export type LocationEstimate = {
  location_id: string
  event_id: string
  method: string
  lat: number
  lon: number
  altitude_km: number | null
  radius_km: number | null
  trajectory_start: unknown
  trajectory_end: unknown
  uncertainty: unknown
}

export type EventWithRelations = EventRow & {
  classifications?: ClassificationRow[] | null
  location_estimates?: LocationEstimate[] | null
  event_detections?: EventDetection[] | null
  signal_features?: SignalFeature[] | null
}

// Foreign-key metadata consumed by the supabase-js select-query parser so that
// nested selects like `events.select('*, classifications (*)`) infer types.
type EventFk = {
  foreignKeyName: string
  columns: ['event_id']
  referencedRelation: 'events'
  referencedColumns: ['event_id']
}

export type Database = {
  public: {
    Tables: {
      users_devices: {
        Row: UsersDevice
        Insert: Partial<UsersDevice> & Pick<UsersDevice, 'device_id' | 'lat' | 'lon'>
        Update: Partial<UsersDevice>
        Relationships: []
      }
      sensor_readings: {
        Row: SensorReading
        Insert: Omit<SensorReading, 'reading_id'> & { reading_id?: string }
        Update: Partial<SensorReading>
        Relationships: [
          {
            foreignKeyName: 'sensor_readings_device_id_fkey'
            columns: ['device_id']
            referencedRelation: 'users_devices'
            referencedColumns: ['device_id']
          },
        ]
      }
      events: {
        Row: EventRow
        Insert: Omit<EventRow, 'event_id' | 'created_at'> & { event_id?: string; created_at?: string }
        Update: Partial<EventRow>
        Relationships: []
      }
      event_detections: {
        Row: EventDetection
        Insert: Omit<EventDetection, 'detection_id'> & { detection_id?: string }
        Update: Partial<EventDetection>
        Relationships: [
          EventFk,
          {
            foreignKeyName: 'event_detections_device_id_fkey'
            columns: ['device_id']
            referencedRelation: 'users_devices'
            referencedColumns: ['device_id']
          },
        ]
      }
      signal_features: {
        Row: SignalFeature
        Insert: SignalFeature
        Update: Partial<SignalFeature>
        Relationships: [
          EventFk,
          {
            foreignKeyName: 'signal_features_device_id_fkey'
            columns: ['device_id']
            referencedRelation: 'users_devices'
            referencedColumns: ['device_id']
          },
        ]
      }
      classifications: {
        Row: ClassificationRow
        Insert: Omit<ClassificationRow, 'classification_id'> & { classification_id?: string }
        Update: Partial<ClassificationRow>
        Relationships: [EventFk]
      }
      location_estimates: {
        Row: LocationEstimate
        Insert: Omit<LocationEstimate, 'location_id'> & { location_id?: string }
        Update: Partial<LocationEstimate>
        Relationships: [EventFk]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
