import { Router } from "express"
import {createUserClient, loginUserClient} from "../controllers/auths.js"

export const UserRouter = Router()

UserRouter.post('/registroCliente', createUserClient)
UserRouter.post('/loginCliente', loginUserClient)




