import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { initializeStorage, initializeBuses } from "./storage";
import { insertDriverSchema, loginDriverSchema, insertBusLocationSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "default-secret";

interface AuthenticatedWebSocket extends WebSocket {
  busId?: string;
  driverId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Initialize storage and buses on startup
  const storage = await initializeStorage();
  await initializeBuses();

  // WebSocket connection handling
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'authenticate':
            const { token } = data;
            try {
              const decoded = jwt.verify(token, JWT_SECRET) as any;
              ws.busId = decoded.busId;
              ws.driverId = decoded.id;
              ws.send(JSON.stringify({ type: 'authenticated', busId: decoded.busId }));
            } catch (error) {
              ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
            }
            break;

          case 'location_update':
            if (ws.busId) {
              const locationData = {
                busId: ws.busId,
                latitude: data.latitude.toString(),
                longitude: data.longitude.toString(),
                isTracking: true,
              };
              
              await storage.updateBusLocation(locationData);
              await storage.updateBusStatus(ws.busId, true);
              await storage.updateDriverStatus(ws.busId, true);
              
              // Broadcast to all clients
              wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'bus_location_update',
                    busId: ws.busId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timestamp: new Date().toISOString(),
                  }));
                }
              });
            }
            break;

          case 'stop_tracking':
            if (ws.busId) {
              await storage.updateBusStatus(ws.busId, false);
              await storage.updateDriverStatus(ws.busId, false);
              
              // Broadcast stop tracking
              wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'bus_tracking_stopped',
                    busId: ws.busId,
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket client disconnected');
      if (ws.busId) {
        await storage.updateBusStatus(ws.busId, false);
        await storage.updateDriverStatus(ws.busId, false);
      }
    });
  });

  // Driver registration
  app.post("/api/driver/register", async (req, res) => {
    try {
      const driverData = insertDriverSchema.parse(req.body);
      
      // Check if driver name already exists
      const existingDriver = await storage.getDriverByName(driverData.name);
      if (existingDriver) {
        return res.status(400).json({ message: "Driver name already exists" });
      }

      const driver = await storage.createDriver(driverData);
      
      const token = jwt.sign(
        { id: driver.id, name: driver.name, busId: driver.busId },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ 
        success: true, 
        driver: { 
          id: driver.id, 
          name: driver.name, 
          busId: driver.busId, 
          route: driver.route 
        },
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Driver login
  app.post("/api/driver/login", async (req, res) => {
    try {
      const loginData = loginDriverSchema.parse(req.body);
      
      const driver = await storage.authenticateDriver(loginData.name, loginData.password);
      if (!driver) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: driver.id, name: driver.name, busId: driver.busId },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ 
        success: true, 
        driver: { 
          id: driver.id, 
          name: driver.name, 
          busId: driver.busId, 
          route: driver.route 
        },
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all buses with their current status
  app.get("/api/buses", async (req, res) => {
    try {
      const buses = await storage.getAllBuses();
      const busesWithLocations = await Promise.all(
        buses.map(async (bus) => {
          const location = await storage.getBusLocation(bus.id);
          return {
            ...bus,
            location: location ? {
              latitude: location.latitude,
              longitude: location.longitude,
              timestamp: location.timestamp,
              isTracking: location.isTracking,
            } : null,
          };
        })
      );
      
      res.json(busesWithLocations);
    } catch (error) {
      console.error("Error fetching buses:", error);
      res.status(500).json({ message: "Failed to fetch buses" });
    }
  });

  // Get specific bus location
  app.get("/api/bus/:busId/location", async (req, res) => {
    try {
      const { busId } = req.params;
      const location = await storage.getBusLocation(busId);
      
      if (!location) {
        return res.status(404).json({ message: "Bus location not found" });
      }
      
      res.json({
        busId: location.busId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        isTracking: location.isTracking,
      });
    } catch (error) {
      console.error("Error fetching bus location:", error);
      res.status(500).json({ message: "Failed to fetch bus location" });
    }
  });

  // Health check endpoint for cloud deployment
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime()
    });
  });

  return httpServer;
}
