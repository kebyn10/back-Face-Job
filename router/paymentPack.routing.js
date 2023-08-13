import { Router } from "express"
import { payment,updatePack,dataPakckage,checkView,updateView,getInfoPack } from "../controllers/paymentPack.js";

export const PaymentRouter = Router()

PaymentRouter.post('/checkout',payment)
PaymentRouter.post('/updatePack',updatePack)
PaymentRouter.get('/infoPack',dataPakckage)
PaymentRouter.post('/checkView',checkView)
PaymentRouter.post('/updateView',updateView)
PaymentRouter.get('/getInfoPack',getInfoPack)