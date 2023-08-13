import jwt from "jsonwebtoken";
import { TOKEN_CODE, TOKEN_EXPIRE, TOKEN_SECRET } from "../config/config.js";
import { nodemailerPass } from "../helpers/nodemailer.js";
import bcrypt from "bcrypt";
import conexion from "../database/db.js";
import validator from "validator";

const getRandomInt = (cod) => {
  cod = Math.floor(Math.random() * (9999 - 1000) + 1000);
  return cod;
};

export const dataUser=async(req,res)=>{
  try {
     const token=req.headers["token"]
  if (token) {
    let correo=jwt.verify(token,TOKEN_SECRET)
    let {email}=correo
    const [result]=await conexion.query('SELECT * FROM cliente where email=?',[email])
    return res.json(result)
  }else{
    return res.json('failed')
  }
  } catch (error) {
    console.log(error);
  }
 
}


export const sendMailEmail = async (req, res) => {
  try {
      let { email } = req.body;
      if (validator.isEmail(email)) {
        let code = getRandomInt(0);
        let response = nodemailerPass(email, code,1);
        const [result] = await conexion.query(
          `UPDATE cliente SET codigo = ? WHERE email = "${email}"`,
          [code]
        );
        return res.json({ message: "send", response, code, result });
      }
    
  } catch (error) {
    console.log(error);
  }
};


export const sendMail = async (req, res) => {
  try {
    const token = req.headers["token"];

    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      let { email } = correo;
      if (validator.isEmail(email)) {
        let code = getRandomInt(0);
        let response = nodemailerPass(email, code,1);
        const [result] = await conexion.query(
          `UPDATE cliente SET codigo = ? WHERE email = "${email}"`,
          [code]
        );
        return res.json({ message: "send", response, code, result });
      }
    }
  } catch (error) {
    console.log(error);
  }
};


export const validateCodeEmail = async (req, res) => {
  try {
   
    let { codigo } = req.body;
    let { email } = req.params;
    const [result] = await conexion.query(
      `SELECT codigo FROM cliente WHERE email = "${email}"`
    );

    let value = { codigo: parseInt(codigo) };
      console.log(codigo);
    console.log(result[0].codigo, "code ->", value.codigo);

      if (value.codigo == result[0].codigo) {
        return res.json({ data: "CODE_VALIDE" });
      } else {
        return res.json({ data: "NOT_VALIDE" });
      }
    
  } catch (error) {
    console.log(error);
  }
};
export const updatePasswordEmail = async (req, res) => {
  const { password } = req.body;
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  try {
   
  
      let { email } = req.params;
      const passOld = await conexion.query(
        `SELECT password FROM cliente WHERE email = "${email}"`
      );
      if (passOld != password) {
        const [result] = await conexion.query(
          `UPDATE cliente SET password = ? WHERE email = "${email}"`,
          [hash]
        );
        if (result.affectedRows != 0) {
          return res.json({ result, data: "PASSWORD_UPDATE" });
        }
      }
    
  } catch (error) {
    console.log(error);
  }
};




export const validateCode = async (req, res) => {
  try {
    const token = req.headers["token"];
    let { codigo } = req.body;
    let correo = jwt.verify(token, TOKEN_SECRET);
    let { email } = correo;
    const [result] = await conexion.query(
      `SELECT codigo FROM cliente WHERE email = "${email}"`
    );

    let value = { codigo: parseInt(codigo) };

    console.log(result[0].codigo, "code ->", value.codigo);

    if (token) {
      if (value.codigo == result[0].codigo) {
        return res.json({ data: "CODE_VALIDE" });
      } else {
        return res.json({ data: "NOT_VALIDE" });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const updatePassword = async (req, res) => {
  const token = req.headers["token"];
  const { password,passsnuevaaa } = req.body;
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  try {
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      let { email } = correo;
      const passOld = await conexion.query(
        `SELECT password FROM cliente WHERE email = "${email}"`
      );


      if (passOld == hash) {
        
        const hashNuevo = bcrypt.hashSync(passsnuevaaa, salt);
        if (passOld!=passsnuevaaa) {
          const [result] = await conexion.query(
         
          `UPDATE cliente SET password = ? WHERE email = "${email}"`,
          [hashNuevo]
        );
        if (result.affectedRows != 0) {
          return res.json({ result, data: "PASSWORD_UPDATE" });
        }
        }else{
          console.log("la contraseña nueva es igual a la antigua");
        }
        
      }else{
        console.log("la contraseña antigua no es igual a la antigua del formulario");
      }
    }
  } catch (error) {
    console.log(error);
  }
};


/* modulo info nombre,apellido,numero,profesion*/

export const updateInfo = async (req,res) =>{
 const token = req.headers["token"];
  const { name, number, profession, lastname} = req.body
  console.log(token
);
try { 
  if (token) {
    let correo = jwt.verify(token, TOKEN_SECRET);
    let { email } = correo;
   
    const [result] = await conexion.query(
    `UPDATE cliente SET name=?,number=?,profession=?,lastname=? where email=?`,[name,number,profession,lastname,email]
    )
    if (result.affectedRows !=0) {
      return res.json({ result, data: "UPDATE_INFO"})
    }else{
      return res.json({data:"UPDATE_NOT"})
    }
  }
} catch (error) {
  console.log(error);
}
}

// Eliminar cuenta

export const deleteAccount = async (req,res) =>{
  try {
  const token = req.headers["token"];
  const password  = req.body.password;
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      let { email } = correo;
      const [result] = await conexion.query(
        `SELECT password FROM cliente WHERE email = "${email}"`
      );
      
      let passwordResult=result[0].password
      bcrypt.compare(password, passwordResult, async (error, isMatch) => {
      if (!isMatch) {
          return res.json({ data: "PASSWORD_ERROR" });
      }else{  
          const [responseMeGusta] = await conexion.query("SELECT * FROM megusta WHERE email_megusta = ?",[email])
          
            if(responseMeGusta.length > 0){
                for (let i = 0; i < responseMeGusta.length; i++) {
                  let idMeGusta = responseMeGusta[i].id_megusta
                  let estado = responseMeGusta[i].estado
                  if (estado == "megusta") {
                    await conexion.query("DELETE FROM megusta WHERE email_megusta = ?",[email])
                    
                    await conexion.query(`UPDATE publicaciones SET likes = (SELECT likes FROM publicaciones WHERE id = ${idMeGusta})-1 WHERE id=?`,[idMeGusta])
                    
                  }
                  if (estado == "nomegusta") {
                    await conexion.query("DELETE FROM megusta WHERE email_megusta = ?",[email])
                    
                  }
                }
            }
          const [responseMeGustaTexto] = await conexion.query("SELECT * FROM megustatextos WHERE email_cliente2 = ?",[email])  
          if (responseMeGustaTexto.length > 0) {
            for (let i = 0; i < responseMeGustaTexto.length; i++) {
              let idMeGustaTextos = responseMeGustaTexto[i].id_textos
              let estado = responseMeGustaTexto[i].estado
              if (estado == "megusta") {
                await conexion.query("DELETE FROM megustatextos WHERE email_cliente2 = ?",[email])
                
                await conexion.query(`UPDATE publicacionestextos SET likes = (SELECT likes FROM publicacionestextos WHERE id = ${idMeGustaTextos})-1 WHERE id=?`,[idMeGustaTextos])
                
              }
              if (estado == "nomegusta") {
                await conexion.query("DELETE FROM megustatextos WHERE email_cliente2 = ?",[email])
                
              } 
            }
          }
          
          const [comentariosCliente] = await conexion.query("SELECT * FROM comentarios_usuario WHERE emailcliente = ?",[email])
          if (comentariosCliente.length > 0) {
            
            for (let i = 0; i < comentariosCliente.length; i++) {
              let idComentario = comentariosCliente[i].id_comentario3
              console.log(idComentario);
              await conexion.query("DELETE FROM comentarios_textos WHERE id_comentario2=?",[idComentario])
              await conexion.query("DELETE FROM comentarios_imagen WHERE id_comentario=?",[idComentario])
              await conexion.query("DELETE FROM comentarios_usuario WHERE emailcliente =?",[email])
              await conexion.query("DELETE FROM comentarios WHERE id=?",[idComentario])
              const [comentarioImagen] = await conexion.query("SELECT * FROM comentarios_imagen WHERE id_comentario = ?",[idComentario])
              if (comentarioImagen.length > 0) {
                let idPublicacion = comentarioImagen[0].idimagen
                await conexion.query(`UPDATE publicaciones SET comments = (SELECT comments FROM publicaciones WHERE id = ${idPublicacion})-1 WHERE id=?`,[idPublicacion]) 
              }
              const [comentarioTexto] = await conexion.query("SELECT * FROM comentarios_textos WHERE id_comentario2 = ?",[idComentario])
              if (comentarioTexto.length > 0) {
                let idPublicacionTexto = comentarioTexto[0].idimagen
                await conexion.query(`UPDATE publicacionestextos SET comments = (SELECT comments FROM publicacionestextos WHERE id = ${idPublicacionTexto})-1 WHERE id=?`,[idPublicacionTexto]) 
              }
              
              
            }
          }

          const [responsePublicacionesClienteImagen] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[email])
          if (responsePublicacionesClienteImagen.length > 0) {
            
            for (let i = 0; i < responsePublicacionesClienteImagen.length; i++) {
              let idPublicacion = responsePublicacionesClienteImagen[i].id2 
              await conexion.query("DELETE FROM publicaciones_cliente WHERE email3 =?",[email])
              await conexion.query("DELETE FROM megusta WHERE id_megusta = ?",[idPublicacion])
              await conexion.query("DELETE FROM megustatextos WHERE id_textos = ?",[idPublicacion])
              await conexion.query("DELETE FROM comentarios_imagen WHERE idimagen=?",[idPublicacion])
              await conexion.query("DELETE FROM comentarios_textos WHERE idtextos=?",[idPublicacion])
              await conexion.query("DELETE FROM publicaciones WHERE id=?",[idPublicacion])
            }
          }


          const [responsePublicacionesClienteTexto] = await conexion.query("SELECT * FROM publicacionestextos_cliente WHERE email4 = ?",[email])
          if (responsePublicacionesClienteTexto.length > 0) {
            
            for (let i = 0; i < responsePublicacionesClienteTexto.length; i++) {
              let idPublicacion = responsePublicacionesClienteTexto[i].id3
              await conexion.query("DELETE FROM publicacionestextos_cliente WHERE email4 =?",[email])
              await conexion.query("DELETE FROM publicacionestextos WHERE id=?",[idPublicacion])
            }
          }

          await conexion.query("DELETE FROM profesionales_vistos WHERE email_cliente =?",[email])
       
          const [deleteWorks]=await conexion.query('DELETE FROM trabajos WHERE mi_email=? or profecional_email=?',[email,email])
          if (deleteWorks.affectedRows!=0) {
            const [deleteMessage]=await conexion.query('DELETE FROM mensaje WHERE remitente=? or receptor=?',[email,email])
            if (deleteMessage.affectedRows!=0) {
              const [deleteClient]=await conexion.query("DELETE FROM cliente WHERE email = ?",[email])
          if (deleteClient.affectedRows != 0) {
         
            res.json({data:"eliminado"})
          }
             
            }
           
          }else{
            const [deleteClient]=await conexion.query("DELETE FROM cliente WHERE email = ?",[email])
          if (deleteClient.affectedRows != 0) {
         
            res.json({data:"eliminado"})
          }
          }
          
          
        }
      });
    }
  } catch (error) {
    console.log(error);
    res.json(error)
  }
}





