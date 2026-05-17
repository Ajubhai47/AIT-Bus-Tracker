import { type Driver, type InsertDriver, type BusLocation, type InsertBusLocation, type Bus } from "@shared/schema";
import { Driver as DriverModel, Bus as BusModel, BusLocation as BusLocationModel } from "./models";
import bcrypt from "bcrypt";

export interface IStorage {
  // Driver operations
  getDriverByName(name: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  authenticateDriver(name: string, password: string): Promise<Driver | null>;
  updateDriverStatus(busId: string, isActive: boolean): Promise<void>;
  
  // Location operations
  updateBusLocation(location: InsertBusLocation): Promise<BusLocation>;
  getBusLocation(busId: string): Promise<BusLocation | undefined>;
  getActiveBusLocations(): Promise<BusLocation[]>;
  
  // Bus operations
  getAllBuses(): Promise<Bus[]>;
  updateBusStatus(busId: string, isActive: boolean): Promise<void>;
}

export class MongoStorage implements IStorage {
  async getDriverByName(name: string): Promise<Driver | undefined> {
    const driver = await DriverModel.findOne({ name }).lean();
    return driver ? this.mapDriverFromMongo(driver) : undefined;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const hashedPassword = await bcrypt.hash(insertDriver.password, 10);
    const driver = await DriverModel.create({
      ...insertDriver,
      password: hashedPassword,
    });
    return this.mapDriverFromMongo(driver);
  }

  async authenticateDriver(name: string, password: string): Promise<Driver | null> {
    const driver = await this.getDriverByName(name);
    if (!driver) return null;
    
    const isValid = await bcrypt.compare(password, driver.password);
    return isValid ? driver : null;
  }

  async updateDriverStatus(busId: string, isActive: boolean): Promise<void> {
    await DriverModel.updateOne({ busId }, { isActive });
  }

  async updateBusLocation(location: InsertBusLocation): Promise<BusLocation> {
    const busLocation = await BusLocationModel.create(location);
    return this.mapBusLocationFromMongo(busLocation);
  }

  async getBusLocation(busId: string): Promise<BusLocation | undefined> {
    const location = await BusLocationModel
      .findOne({ busId })
      .sort({ timestamp: -1 })
      .lean();
    return location ? this.mapBusLocationFromMongo(location) : undefined;
  }

  async getActiveBusLocations(): Promise<BusLocation[]> {
    const locations = await BusLocationModel
      .find({ isTracking: true })
      .sort({ timestamp: -1 })
      .lean();
    return locations.map((loc: any) => this.mapBusLocationFromMongo(loc));
  }

  async getAllBuses(): Promise<Bus[]> {
    const buses = await BusModel.find().lean();
    return buses.map((bus: any) => this.mapBusFromMongo(bus));
  }

  async updateBusStatus(busId: string, isActive: boolean): Promise<void> {
    await BusModel.updateOne({ id: busId }, { isActive });
  }

  // Helper methods to map MongoDB documents to domain types
  private mapDriverFromMongo(driver: any): Driver {
    return {
      id: driver._id.toString(),
      name: driver.name,
      busId: driver.busId,
      route: driver.route,
      password: driver.password,
      isActive: driver.isActive,
      createdAt: driver.createdAt,
    };
  }

  private mapBusLocationFromMongo(location: any): BusLocation {
    return {
      id: location._id.toString(),
      busId: location.busId,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp,
      isTracking: location.isTracking,
    };
  }

  private mapBusFromMongo(bus: any): Bus {
    return {
      id: bus.id,
      name: bus.name,
      route: bus.route,
      color: bus.color,
      isActive: bus.isActive,
    };
  }
}

// In-memory storage as fallback
export class MemStorage implements IStorage {
  private drivers: Driver[] = [];
  private buses: Bus[] = [];
  private locations: BusLocation[] = [];
  private idCounter = 1;

  constructor() {
    // Initialize with default buses
    this.buses = [
      { id: "ait1", name: "AIT1", route: "Bus Stand", color: "#FF5722", isActive: false },
      { id: "ait2", name: "AIT2", route: "Bus Stand", color: "#E91E63", isActive: false },
      { id: "ait3", name: "AIT3", route: "Vijaipura", color: "#9C27B0", isActive: false },
      { id: "ait4", name: "AIT4", route: "Vijaipura", color: "#673AB7", isActive: false },
      { id: "ait5", name: "AIT5", route: "Kote", color: "#3F51B5", isActive: false },
      { id: "ait6", name: "AIT6", route: "Kote", color: "#2196F3", isActive: false },
      { id: "ait7", name: "AIT7", route: "Hostel", color: "#4CAF50", isActive: false },
    ];
  }

  async getDriverByName(name: string): Promise<Driver | undefined> {
    return this.drivers.find(d => d.name === name);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const hashedPassword = await bcrypt.hash(insertDriver.password, 10);
    const driver: Driver = {
      id: (this.idCounter++).toString(),
      ...insertDriver,
      password: hashedPassword,
      isActive: false,
      createdAt: new Date(),
    };
    this.drivers.push(driver);
    return driver;
  }

  async authenticateDriver(name: string, password: string): Promise<Driver | null> {
    const driver = await this.getDriverByName(name);
    if (!driver) return null;
    
    const isValid = await bcrypt.compare(password, driver.password);
    return isValid ? driver : null;
  }

  async updateDriverStatus(busId: string, isActive: boolean): Promise<void> {
    const driver = this.drivers.find(d => d.busId === busId);
    if (driver) {
      driver.isActive = isActive;
    }
  }

  async updateBusLocation(location: InsertBusLocation): Promise<BusLocation> {
    const busLocation: BusLocation = {
      id: (this.idCounter++).toString(),
      ...location,
      timestamp: new Date(),
    };
    this.locations.push(busLocation);
    return busLocation;
  }

  async getBusLocation(busId: string): Promise<BusLocation | undefined> {
    return this.locations
      .filter(l => l.busId === busId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  async getActiveBusLocations(): Promise<BusLocation[]> {
    return this.locations
      .filter(l => l.isTracking)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAllBuses(): Promise<Bus[]> {
    return this.buses;
  }

  async updateBusStatus(busId: string, isActive: boolean): Promise<void> {
    const bus = this.buses.find(b => b.id === busId);
    if (bus) {
      bus.isActive = isActive;
    }
  }
}

// Storage factory with fallback
let storageInstance: IStorage;

export async function initializeStorage(): Promise<IStorage> {
  if (storageInstance) return storageInstance;
  
  try {
    // Try MongoDB first
    const mongoStorage = new MongoStorage();
    storageInstance = mongoStorage;
    console.log('✅ Using MongoDB storage');
    return storageInstance;
  } catch (error) {
    console.warn('❌ MongoDB connection failed, falling back to memory storage:', error instanceof Error ? error.message : 'Unknown error');
    storageInstance = new MemStorage();
    console.log('✅ Using memory storage as fallback');
    return storageInstance;
  }
}

// Export storage instance - initialize MongoDB storage by default
let storage: IStorage;

// Initialize storage with MongoDB
(async () => {
  try {
    storage = await initializeStorage();
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    storage = new MemStorage();
  }
})();

export { storage };

// Initialize default buses
export async function initializeBuses() {
  const defaultBuses = [
    { id: "ait1", name: "AIT1", route: "Bus Stand", color: "#FF5722", isActive: false },
    { id: "ait2", name: "AIT2", route: "Bus Stand", color: "#E91E63", isActive: false },
    { id: "ait3", name: "AIT3", route: "Vijaipura", color: "#9C27B0", isActive: false },
    { id: "ait4", name: "AIT4", route: "Vijaipura", color: "#673AB7", isActive: false },
    { id: "ait5", name: "AIT5", route: "Kote", color: "#3F51B5", isActive: false },
    { id: "ait6", name: "AIT6", route: "Kote", color: "#2196F3", isActive: false },
    { id: "ait7", name: "AIT7", route: "Hostel", color: "#4CAF50", isActive: false },
  ];

  try {
    // Upsert buses - only insert if they don't exist
    for (const bus of defaultBuses) {
      await BusModel.updateOne(
        { id: bus.id },
        { $setOnInsert: bus },
        { upsert: true }
      );
    }
    console.log('Default buses initialized');
  } catch (error) {
    console.error("Error initializing buses:", error);
  }
}
