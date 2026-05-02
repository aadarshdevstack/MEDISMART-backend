import 'dotenv/config';
import mongoose from "mongoose";
import { Admin } from '../models/admin.model.js';
import { DB_NAME } from '../constants.js';
import dns from "dns"

dns.setServers(["1.1.1.1" , "8.8.8.8"])

const createAdmin = async () => {
    try {
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            console.error("ADMIN_EMAIL or ADMIN_PASSWORD missing in env");
            process.exit(1);
        }

        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("MongoDB connected");

        const existingAdmin = await Admin.findOne({ 
            email: process.env.ADMIN_EMAIL 
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            await mongoose.disconnect();
            console.log("MongoDB disconnected");
            process.exit(0);
        }

        const admin = await Admin.create({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD
        });

        console.log("Admin created successfully:", admin.email);

        await mongoose.disconnect();
        console.log("MongoDB disconnected");

        process.exit(0);

    } catch (error) {
        console.error("Error creating admin:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

createAdmin();