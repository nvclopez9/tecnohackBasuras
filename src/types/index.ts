export interface PhotoEntry {
  id: string;
  base64: string;
  thumbnail: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
}
