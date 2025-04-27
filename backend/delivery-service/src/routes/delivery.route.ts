// src/routes/deliveryRoutes.ts
import express from "express";
import * as deliveryController from "../controllers/delivery.controller";

const router = express.Router();

// Health Check
router.get("/health", deliveryController.healthCheck);

// Create a new delivery
router.post("/", deliveryController.createDelivery);

// Get all deliveries
router.get("/", deliveryController.getAllDeliveries);

// Get deliveries by customer ID
router.get("/customer/:customerId", deliveryController.getDeliveriesByCustomerId);

// Get deliveries by driver ID
router.get("/driver/:driverId", deliveryController.getDeliveriesByDriverId);

// Get deliveries by restaurant ID
router.get("/restaurant/:restaurantId", deliveryController.getDeliveriesByRestaurantId);

// Get a specific delivery with order details
router.get("/:id/with-order", deliveryController.getDeliveryWithOrderDetails);

// Get a specific delivery by ID
router.get("/:id", deliveryController.getDeliveryById);

// Update a delivery by ID
router.put("/:id", deliveryController.updateDelivery);

// Delete a delivery by ID
router.delete("/:id", deliveryController.deleteDelivery);

export default router;
