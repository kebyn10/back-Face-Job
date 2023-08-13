import dotenv from "dotenv";
dotenv.config()
// DATABASE ->
export const PORT_APP = process.env["PORT_APP"]
export const HOST = process.env["DATABASE_HOST"]
export const USER = process.env["DATABASE_USER"]
export const PASSWORD = process.env["DATABASE_PASSWORD"]
export const DATABASE = process.env["DATABASE_NAME"]
export const PORTDB = process.env["DATABASE_PORT"]

// Upload Images to Cloudinary ->
export const CLOUD_NAME = process.env["CLOUD_NAME"]
export const CLOUD_API_KEY = process.env["CLOUD_API_KEY"]
export const CLOUD_API_SECRET = process.env["CLOUD_API_SECRET"]

// Tokens " JWT " ->
export const TOKEN_SECRET = process.env["TOKEN_SECRET"]
export const TOKEN_EXPIRE = process.env["TOKEN_EXPIRE"]
export const TOKEN_CODE = process.env["TOKEN_CODE"]

// Data Send Emails -> 
export const HOST_EMAIL =process.env[""]
