import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://appcom:Ajjubhai47@ac-hl8uh96-shard-00-00.out5zm5.mongodb.net:27017,ac-hl8uh96-shard-00-01.out5zm5.mongodb.net:27017,ac-hl8uh96-shard-00-02.out5zm5.mongodb.net:27017/ethicproctor?ssl=true&replicaSet=atlas-usd7lt-shard-0&authSource=admin&retryWrites=true&w=majority&appName=APPCOM';

export async function connectMongo() {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log('MongoDB already connected');
      return;
    }

    // Disable buffering to fail fast if not connected
    mongoose.set('bufferCommands', false);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to fix SRV ECONNREFUSED on Windows
    });

    console.log('Connected to MongoDB Atlas');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Retry connection after delay
    setTimeout(connectMongo, 5000);
  }
}

export async function disconnectMongo() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}