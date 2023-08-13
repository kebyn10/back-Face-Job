import { Router } from "express"
import { deleteComments,updateComments,createPost, createPostTextos,getComments, DeletePost, DeletePostText, DontLike, DontLikeText, imagenPerfil, likesImg, likesTexts, UpdateText, userPosts, userPostsTextos,insertComment, insertCommentText, getCommentsText, deleteCommentsText } from "../controllers/publicaciones.js"

export const PostsUserRouter = Router()

PostsUserRouter.put('/user/image',imagenPerfil)
PostsUserRouter.get('/user/postsimagenes/:email', userPosts)
PostsUserRouter.post('/user/createposttext/:email', createPostTextos)
PostsUserRouter.post('/user/createpost/:email', createPost)
PostsUserRouter.get('/user/userPoststextos/:email', userPostsTextos)
PostsUserRouter.post('/user/usermegusta', likesImg)
PostsUserRouter.post('/user/usernomegusta', DontLike)
PostsUserRouter.post('/user/usermegustatext', likesTexts)
PostsUserRouter.post('/user/usernomegustatext', DontLikeText)
PostsUserRouter.delete('/user/userEliminaPost/:id', DeletePost)
PostsUserRouter.delete('/user/userEliminaPostText/:id', DeletePostText)
PostsUserRouter.put('/user/userUpdatePostText/:id', UpdateText)

PostsUserRouter.post('/user/insertComment/:id', insertComment)
PostsUserRouter.get('/user/getComments/:id', getComments)
PostsUserRouter.put('/user/updateComments/:id', updateComments)
PostsUserRouter.put('/user/deleteComments/:id', deleteComments)

PostsUserRouter.post('/user/insertCommentText/:id', insertCommentText)
PostsUserRouter.get('/user/getCommentsText/:id', getCommentsText)
PostsUserRouter.put('/user/deleteCommentsText/:id', deleteCommentsText)


