// src/controllers/deliveryController.ts
import { Request, Response } from "express";
import * as deliveryService from "../services/delivery.service";

/**
 * Create a new delivery
 */
export const createDelivery = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);
    res.status(201).json(delivery);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all deliveries
 */
export const getAllDeliveries = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const deliveries = await deliveryService.getAllDeliveries();
    res.status(200).json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get deliveries by customer ID
 */
export const getDeliveriesByCustomerId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = req.params.customerId;
    const deliveries = await deliveryService.getDeliveriesByCustomerId(customerId);
    res.status(200).json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get deliveries by driver ID
 */
export const getDeliveriesByDriverId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const driverId = req.params.driverId;
    const deliveries = await deliveryService.getDeliveriesByDriverId(driverId);
    res.status(200).json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get deliveries by restaurant ID
 */
export const getDeliveriesByRestaurantId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId;
    const deliveries = await deliveryService.getDeliveriesByRestaurantId(restaurantId);
    res.status(200).json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a delivery by ID
 */
export const getDeliveryById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    if (!delivery) {
      res.status(404).json({ error: "Delivery not found" });
      return;
    }
    res.status(200).json(delivery);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get delivery with order details
 */
export const getDeliveryWithOrderDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await deliveryService.getDeliveryWithOrderDetails(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Delivery not found" });
      return;
    }
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a delivery
 */
export const updateDelivery = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const updatedDelivery = await deliveryService.updateDelivery(
      req.params.id,
      req.body,
    );
    if (!updatedDelivery) {
      res.status(404).json({ error: "Delivery not found" });
      return;
    }
    res.status(200).json(updatedDelivery);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a delivery
 */
export const deleteDelivery = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const deletedDelivery = await deliveryService.deleteDelivery(req.params.id);
    if (!deletedDelivery) {
      res.status(404).json({ error: "Delivery not found" });
      return;
    }
    res.status(200).json({ message: "Delivery deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Health Check Endpoint
 */
export const healthCheck = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.status(200).json({ status: "UP" });
};
