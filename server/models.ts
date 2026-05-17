import mongoose, { Document, Schema } from 'mongoose';

export interface IDriver extends Document {
  name: string;
  busId: string;
  route: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IBus extends Document {
  id: string;
  name: string;
  route: string;
  color: string;
  isActive: boolean;
}

export interface IBusLocation extends Document {
  busId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  isTracking: boolean;
}

const driverSchema = new Schema<IDriver>({
  name: { type: String, required: true },
  busId: { type: String, required: true, unique: true },
  route: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const busSchema = new Schema<IBus>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  route: { type: String, required: true },
  color: { type: String, required: true },
  isActive: { type: Boolean, default: false },
});

const busLocationSchema = new Schema<IBusLocation>({
  busId: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  isTracking: { type: Boolean, default: false },
});

// Compound index for efficient last-location queries
busLocationSchema.index({ busId: 1, timestamp: -1 });

export const Driver = mongoose.model<IDriver>('Driver', driverSchema);
export const Bus = mongoose.model<IBus>('Bus', busSchema);
export const BusLocation = mongoose.model<IBusLocation>('BusLocation', busLocationSchema);