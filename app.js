import express, { json } from "express";
import sessions from "express-session";
import cors from "cors"
import bodyParser from"body-parser"
import {PORT_APP} from './config/config.js'
import fileUpload from 'express-fileupload'
import http from 'http'
import { Server as SoketServer } from "socket.io";
import { socketMessage } from "./utils/sockets.js";

//Import Routers
import {UserRouter} from "./router/User.routing.js";
import { PostsUserRouter } from "./router/PostsUser.routing.js";
import { CatalogueRouter } from "./router/Catalogue.routing.js";
import { profileUser } from "./router/profileUser.routing.js";
import { PaymentRouter } from "./router/paymentPack.routing.js";
import { MessagesRouter } from "./router/Messages.Routes.js";
import { RouterAdmin } from "./router/Admin.Routes.js";

const timeExp = 1000 * 60 * 60 * 24;
export const app = express();
const server=http.createServer(app)
const io=new SoketServer(server,{
  cors:{
    origin:'*'
  }
})
app.use(cors())
app.use(json())
app.use(express.json())
app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json())
app.use(fileUpload({
  useTempFiles:true,
  tempFileDir:'./upload'
}))
//soket io -->
socketMessage(io)






// Rutas -->
app.use(UserRouter)
app.use(PostsUserRouter)
app.use(CatalogueRouter)
app.use(profileUser)
app.use(PaymentRouter)
app.use(MessagesRouter)
app.use(PaymentRouter)
app.use(RouterAdmin)

// Server -->
app.set('port',process.env.PORT_APP || PORT_APP);
server.listen(app.get('port'), () => {
  console.log(`Server running FACE-JOB ${app.get('port')}`);
});

//

