import {v2 as cloudinary} from "cloudinary"
import {CLOUD_API_KEY, CLOUD_NAME, CLOUD_API_SECRET} from '../config/config.js'


cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret : CLOUD_API_SECRET
})

export const  uploadImage= async filePath =>{
 return  await cloudinary.uploader.upload(filePath,{
folder:'posts'
 })
    

}


export const  uploadImageChat= async filePath =>{
    return  await cloudinary.uploader.upload(filePath,{
   folder:'Images Chat'
    })
       
   
   }

