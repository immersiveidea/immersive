import express from "express";
import ViteExpress from "vite-express";
import dotenv from "dotenv";
import expressProxy from "express-http-proxy";
dotenv.config();



const app = express();

app.use("/api", expressProxy("local.immersiveidea.com"));



ViteExpress.listen(app, process.env.PORT || 3001, () => console.log("Server is listening..."));
