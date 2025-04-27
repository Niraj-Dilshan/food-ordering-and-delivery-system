import mongoose, { Document, Schema } from "mongoose";

export interface IDriverDetails {
  driverId: string;
  driverName: string;
  vehicleNumber: string;
}

export interface ICustomerDetails {
  name: string;
  contact: string;
  longitude: number;
  latitude: number;
}

export interface ICartItem {
  itemId: string;
  itemName: string;
  quantity: number;
  potionSize: 'Small' | 'Medium' | 'Large';
  price: number;
  totalPrice: number;
  image: string;
}

export interface IOrder extends Document {
  orderId: string;
  customerId: string;
  restaurantId: string;
  customerDetails: ICustomerDetails;
  cartItems: ICartItem[];
  orderTotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentType: string;
  orderStatus: string;
  driverDetails?: IDriverDetails;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true },
    customerId: { type: String, required: true },
    restaurantId: { type: String, required: true },
    customerDetails: {
      name: { type: String, required: true },
      contact: { type: String, required: true },
      longitude: { type: Number, required: true },
      latitude: { type: Number, required: true }
    },
    cartItems: [
      {
        itemId: { type: String, required: true },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        potionSize: { type: String, required: true, enum: ['Small', 'Medium', 'Large'] },
        price: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        image: { type: String }
      }
    ],
    orderTotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentType: { type: String, required: true },
    orderStatus: { type: String, required: true },
    driverDetails: {
      driverId: { type: String },
      driverName: { type: String },
      vehicleNumber: { type: String }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
);

// Use the same mongoose instance but specify the correct database and collection
const Order = mongoose.model<IOrder>('Order', orderSchema, 'orders');

export default Order; 