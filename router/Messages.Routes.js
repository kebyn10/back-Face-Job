import { Router } from "express";
import { sendMenssage,messagesPrivate,sendReport,delteChatComversations,workingUsers,newsWorks,dataUsuerChat,createNewChat } from "../controllers/menssagesController.js";


export const MessagesRouter=Router()

MessagesRouter.post('/sendMenssage/:id',sendMenssage)
MessagesRouter.get('/messagesPrivate/:id',messagesPrivate)
MessagesRouter.delete('/deleteChat/:id',delteChatComversations)
MessagesRouter.get('/workingUsers/:id',workingUsers)
MessagesRouter.get('/newWorks/:id',newsWorks)
MessagesRouter.get('/dataUsuerChat/:email',dataUsuerChat)
MessagesRouter.post('/delteChatComversations/:id',delteChatComversations)
MessagesRouter.get('/createNewChat/:id',createNewChat)
MessagesRouter.post('/sendReport/:id',sendReport)
