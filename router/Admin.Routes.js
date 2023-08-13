import { reports,solucion,messagesUsers,deleteAccountAdmin } from "../controllers/admin.js";
import { Router } from "express";

export const RouterAdmin=Router()

RouterAdmin.get('/reports',reports)
RouterAdmin.post('/solucion',solucion)
RouterAdmin.post('/messagesUsers',messagesUsers)
RouterAdmin.post('/deleteAccountAdmin',deleteAccountAdmin)