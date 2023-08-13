import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/config.js";
import conexion from "../database/db.js";
import Stripe from 'stripe'
import { nodemailerPass } from "../helpers/nodemailer.js";

const stripe=new Stripe('sk_test_51MsvOdAbbMzh5r4qlzSwQ78W5wFGuS11mipmHGogqjnUVGm2WM8GaYQojootumYgXTyidcyFojM0PacJAzrLobr800aNMkwlpr')

export const payment = async(req,res) =>{
    try {
        
    const {id,amount,paquete}=req.body
        const pay=  await stripe.paymentIntents.create({
            amount:amount,
            currency:"COP",
            description:paquete,
            payment_method:id,
            confirm:true
        })
        res.json("confirm")
        } catch (error) {
            console.log(error);
            res.json(error.raw.message)
        }
}

export const updatePack = async (req,res) =>{
    try {
        const token=req.headers["token"]
        let {pack} = req.body

        if (token) {
            let correo=jwt.verify(token,TOKEN_SECRET)
            let {email}=correo 
            if(pack == 1){
                
                const [result] = await conexion.query('UPDATE cliente SET cod_paquete = "1" , info_paquete = 5 WHERE email = ?',[email])
                if (result.affectedRows != 0) {
                    let response = nodemailerPass(email);
                    res.json({data:"update pack"})
                }
            }
            if(pack == 2){
                const [result] = await conexion.query('UPDATE cliente SET cod_paquete = "2" , info_paquete = 10 WHERE email = ?',[email])
                if (result.affectedRows != 0) {
                    let response = nodemailerPass(email);
                    res.json({data:"update pack"})
                }
            }
            if(pack == 3){
                const [result] = await conexion.query('UPDATE cliente SET cod_paquete = "3" , info_paquete = 15 WHERE email = ?',[email])
                if (result.affectedRows != 0) {
                    let response = nodemailerPass(email);
                    res.json({data:"update pack"})
                }
            }
            
        }
    } catch (error) {
        res.json(error)
        console.log(error);
    }
      
}

export const dataPakckage = async(req,res) => {
    try {
        const token = req.headers['token']
        
        if (token) {
            let correo=jwt.verify(token,TOKEN_SECRET)
            let {email}=correo 
            const [result] = await conexion.query('SELECT info_paquete FROM cliente WHERE email=?',[email])  
            const infoPaquete = result[0].info_paquete
            if (result[0].info_paquete > 1) {
               const [update] = await conexion.query(`UPDATE cliente SET info_paquete = ${infoPaquete}-1 WHERE email = ?`,[email]) 
               if (update.affectedRows != 0) {
                res.json({data:"access"})
               }else{
                res.json({data:"error al validar"})
               }
               
            }else if(result[0].info_paquete == 1){
                const [update] = await conexion.query(`UPDATE cliente SET info_paquete = ${infoPaquete}-1 WHERE email = ?`,[email]) 
                const [pack] = await conexion.query('SELECT cod_paquete FROM cliente WHERE email=?',[email])
                if (pack[0].cod_paquete ==  "1" || pack[0].cod_paquete ==  "2" || pack[0].cod_paquete ==  "3") {
                    await conexion.query(`UPDATE cliente SET cod_paquete = "4" WHERE email = ?`,[email])
                }
               if (update.affectedRows != 0) {
                res.json({data:"access"})
               }else{
                res.json({data:"error al validar"})
               }
            }else{
                res.json({data:"access deneid"})
            }
        }
    } catch (error) {
        console.error(error);
        res.json(error)
    }
}

export const checkView = async(req,res) => {
    try {
        const token = req.headers['token']

        if (token) {
            let correo=jwt.verify(token,TOKEN_SECRET)
            let {email}=correo 
            let {emailUser} = req.body

            const [result] = await conexion.query('SELECT email_visto FROM profesionales_vistos WHERE email_cliente = ?',[email])
            if (result == "") {
                res.json("Not seen")
            }else{
                let confirm = false
                for (let i = 0; i < result.length; i++) {
                    if (result[i].email_visto == emailUser) {
                        confirm = true
                    }
                }
                if(confirm){
                    res.json("Yes seen")
                }else{
                    res.json("Not seen")
                }
            }
            
        }

    } catch (error) {
        console.log(error);
        res.json(error)
    }
}

export const updateView = async(req,res) => {
    try {
        const token = req.headers['token']

        if (token) {
            let correo=jwt.verify(token,TOKEN_SECRET)
            let {email}=correo 
            let {emailUser} = req.body

            console.log(emailUser);

            const [result] = await conexion.query('INSERT INTO profesionales_vistos(email_cliente, email_visto) VALUES ( ? , ? )',[email,emailUser])
            
           if (result.affectedRows !=0) {
                res.json("Update")
           } else {
                res.json("Error")
           }
            
        }

    } catch (error) {
        console.log(error);
        res.json(error)
    }
}

export const getInfoPack = async(req,res) =>{
    try {
        const token = req.headers['token']

        if (token) {
            let correo=jwt.verify(token,TOKEN_SECRET)
            let {email}=correo

            const result = await conexion.query('SELECT info_paquete FROM cliente WHERE email = ?',[email])
            let resp =result[0]
        
            if (resp[0].info_paquete == 0) {
                res.json("view pack")
            }else{
                res.json("no view pack")
            }
        }else{
            res.json("view pack")
        }
    } catch (error) {
        res.json(error)
        console.log(error);
    }
}
