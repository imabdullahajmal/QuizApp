import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quizapp";

async function start() {
	// Attempt initial MongoDB connection but don't crash the process if it fails.
	// Use a short serverSelectionTimeoutMS so failures are fast during development.
	try {
		await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("MongoDB initial connection failed:", err.message || err);
		console.warn(
			"The server will start without a DB connection. Routes that require the database may fail."
		);
	}

	const server = app.listen(PORT, () => {
		console.log(`Server listening on port ${PORT}`);
	});

	// If DB wasn't connected, try reconnecting in the background every 30s
	const tryReconnectIntervalMs = 30_000;
	let reconnectHandle = null;

	const startBackgroundReconnect = () => {
		if (reconnectHandle) return;
		reconnectHandle = setInterval(async () => {
			if (mongoose.connection.readyState === 1) {
				clearInterval(reconnectHandle);
				reconnectHandle = null;
				return;
			}
			try {
				console.log("Attempting MongoDB reconnect...");
				await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
				console.log("MongoDB reconnected");
				if (reconnectHandle) {
					clearInterval(reconnectHandle);
					reconnectHandle = null;
				}
			} catch (e) {
				console.debug("Reconnect attempt failed:", e.message || e);
			}
		}, tryReconnectIntervalMs);
	};

	if (mongoose.connection.readyState !== 1) {
		startBackgroundReconnect();
	}

	// Graceful shutdown
	const shutdown = async (signal) => {
		console.log(`${signal} received: closing server`);
		server.close(async (err) => {
			if (err) {
				console.error("Error closing server:", err);
				process.exit(1);
			}
			try {
				if (reconnectHandle) clearInterval(reconnectHandle);
				await mongoose.disconnect();
				console.log("MongoDB disconnected");
				process.exit(0);
			} catch (e) {
				console.error("Error during mongoose.disconnect():", e);
				process.exit(1);
			}
		});
	};

	process.on("SIGINT", () => shutdown("SIGINT"));
	process.on("SIGTERM", () => shutdown("SIGTERM"));

	process.on("unhandledRejection", (reason, promise) => {
		console.error("Unhandled Rejection at:", promise, "reason:", reason);
	});
}

start();

