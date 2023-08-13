import conexion from "../database/db.js";
import jwt from "jsonwebtoken";
import { TOKEN_CODE, TOKEN_EXPIRE, TOKEN_SECRET } from "../config/config.js";
import bcrypt from "bcrypt";

export const reports = async (req, res) => {
  try {
    const token = req.headers['token']
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET)
      let { email } = correo
      if (email == "face-job-admin@facejob.com") {
        const [result] = await conexion.query('SELECT * FROM reportes ORDER BY tiempo ASC')
        if (result.length > 0) {
          res.json(result)
        } else {
          res.json({ data: "no hay reportes" })
        }
      }
    }
  } catch (error) {
    return res.json({ error })
  }
}


export const solucion = async (req, res) => {
  try {
    const token = req.headers['token']
    const { email_reporte, email_reportado, id } = req.body
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET)
      let { email } = correo
      if (email == "face-job-admin@facejob.com") {

        let nuevoEstado = 'Eliminado'
        const [resulti] = await conexion.query('UPDATE trabajos SET estado=? WHERE mi_email=? AND profecional_email=? OR mi_email=? AND profecional_email=?', [nuevoEstado, email_reporte, email_reportado, email_reportado, email_reporte])
        if (resulti.affectedRows != 0) {
          const [result] = await conexion.query('DELETE FROM reportes WHERE reportes.id_reporte=?', [id])
          if (result.affectedRows != 0) {
            res.json("reporte solucionado")
          } else {
            res.json("mal solucion")
          }
        }
      }
    }

  } catch (error) {
    return res.status(500).json({data : error})
  }
}



export const messagesUsers = async (req, res) => {
  try {
    const token = req.headers['token'];
    const { email_reporte, email_reportado } = req.body
    if (token) {

      let correo = jwt.verify(token, TOKEN_SECRET)
      let { email } = correo
      if (email == "face-job-admin@facejob.com") {
        const [result] = await conexion.query("SELECT *,DATE_FORMAT(fecha,'%H:%i:%s') AS hora from mensaje WHERE remitente=? and receptor=? or remitente=? and receptor=? ", [email_reporte, email_reportado, email_reportado, email_reporte])
        if (result.length > 0) {

          for (let i = 0; i < result.length; i++) {
            let horas = result[i].hora.split(":", 2)
            let horasFinal = `${horas[0]}:${horas[1]}`
            result[i].hora = horasFinal
          }

          res.json(result)
        } else {
          res.json('not results')
        }

      }
    }

  } catch (error) {
    return res.json({error})
  }
}



export const deleteAccountAdmin = async (req, res) => {
  try {
    const token = req.headers["token"];
    const { password, reportado, id } = req.body;
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      let { email } = correo;
      let emailADmin = email
      email = reportado
      if (emailADmin == "face-job-admin@facejob.com") {

        await conexion.query('DELETE FROM reportes WHERE reportes.id_reporte=?', [id])
        const [result] = await conexion.query(
          `SELECT password FROM cliente WHERE email = "${emailADmin}"`
        );

        let passwordResult = result[0].password
        bcrypt.compare(password, passwordResult, async (error, isMatch) => {
          if (!isMatch) {
            return res.json({ data: "PASSWORD_ERROR" });
          } else {

            const [responseMeGusta] = await conexion.query("SELECT * FROM megusta WHERE email_megusta = ?", [email])

            if (responseMeGusta.length > 0) {
              for (let i = 0; i < responseMeGusta.length; i++) {
                let idMeGusta = responseMeGusta[i].id_megusta
                let estado = responseMeGusta[i].estado
                if (estado == "megusta") {
                  await conexion.query("DELETE FROM megusta WHERE email_megusta = ?", [email])

                  await conexion.query(`UPDATE publicaciones SET likes = (SELECT likes FROM publicaciones WHERE id = ${idMeGusta})-1 WHERE id=?`, [idMeGusta])

                }
                if (estado == "nomegusta") {
                  await conexion.query("DELETE FROM megusta WHERE email_megusta = ?", [email])

                }
              }
            }
            const [responseMeGustaTexto] = await conexion.query("SELECT * FROM megustatextos WHERE email_cliente2 = ?", [email])
            if (responseMeGustaTexto.length > 0) {
              for (let i = 0; i < responseMeGustaTexto.length; i++) {
                let idMeGustaTextos = responseMeGustaTexto[i].id_textos
                let estado = responseMeGustaTexto[i].estado
                if (estado == "megusta") {
                  await conexion.query("DELETE FROM megustatextos WHERE email_cliente2 = ?", [email])

                  await conexion.query(`UPDATE publicacionestextos SET likes = (SELECT likes FROM publicacionestextos WHERE id = ${idMeGustaTextos})-1 WHERE id=?`, [idMeGustaTextos])

                }
                if (estado == "nomegusta") {
                  await conexion.query("DELETE FROM megustatextos WHERE email_cliente2 = ?", [email])

                }
              }
            }

            const [comentariosCliente] = await conexion.query("SELECT * FROM comentarios_usuario WHERE emailcliente = ?", [email])
            if (comentariosCliente.length > 0) {

              for (let i = 0; i < comentariosCliente.length; i++) {
                let idComentario = comentariosCliente[i].id_comentario3
                console.log(idComentario);
                await conexion.query("DELETE FROM comentarios_textos WHERE id_comentario2=?", [idComentario])
                await conexion.query("DELETE FROM comentarios_imagen WHERE id_comentario=?", [idComentario])
                await conexion.query("DELETE FROM comentarios_usuario WHERE emailcliente =?", [email])
                await conexion.query("DELETE FROM comentarios WHERE id=?", [idComentario])
                const [comentarioImagen] = await conexion.query("SELECT * FROM comentarios_imagen WHERE id_comentario = ?", [idComentario])
                if (comentarioImagen.length > 0) {
                  let idPublicacion = comentarioImagen[0].idimagen
                  await conexion.query(`UPDATE publicaciones SET comments = (SELECT comments FROM publicaciones WHERE id = ${idPublicacion})-1 WHERE id=?`, [idPublicacion])
                }
                const [comentarioTexto] = await conexion.query("SELECT * FROM comentarios_textos WHERE id_comentario2 = ?", [idComentario])
                if (comentarioTexto.length > 0) {
                  let idPublicacionTexto = comentarioTexto[0].idimagen
                  await conexion.query(`UPDATE publicacionestextos SET comments = (SELECT comments FROM publicacionestextos WHERE id = ${idPublicacionTexto})-1 WHERE id=?`, [idPublicacionTexto])
                }


              }
            }

            const [responsePublicacionesClienteImagen] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?", [email])
            if (responsePublicacionesClienteImagen.length > 0) {

              for (let i = 0; i < responsePublicacionesClienteImagen.length; i++) {
                let idPublicacion = responsePublicacionesClienteImagen[i].id2
                await conexion.query("DELETE FROM publicaciones_cliente WHERE email3 =?", [email])
                await conexion.query("DELETE FROM megusta WHERE id_megusta = ?", [idPublicacion])
                await conexion.query("DELETE FROM megustatextos WHERE id_textos = ?", [idPublicacion])
                await conexion.query("DELETE FROM comentarios_imagen WHERE idimagen=?", [idPublicacion])
                await conexion.query("DELETE FROM comentarios_textos WHERE idtextos=?", [idPublicacion])
                await conexion.query("DELETE FROM publicaciones WHERE id=?", [idPublicacion])
              }
            }


            const [responsePublicacionesClienteTexto] = await conexion.query("SELECT * FROM publicacionestextos_cliente WHERE email4 = ?", [email])
            if (responsePublicacionesClienteTexto.length > 0) {

              for (let i = 0; i < responsePublicacionesClienteTexto.length; i++) {
                let idPublicacion = responsePublicacionesClienteTexto[i].id3
                await conexion.query("DELETE FROM publicacionestextos_cliente WHERE email4 =?", [email])
                await conexion.query("DELETE FROM publicacionestextos WHERE id=?", [idPublicacion])
              }
            }

            await conexion.query("DELETE FROM profesionales_vistos WHERE email_cliente =?", [email])

            const [deleteWorks] = await conexion.query('DELETE FROM trabajos WHERE mi_email=? or profecional_email=?', [email, email])
            if (deleteWorks.affectedRows != 0) {
              const [deleteMessage] = await conexion.query('DELETE FROM mensaje WHERE remitente=? or receptor=?', [email, email])
              if (deleteMessage.affectedRows != 0) {
                const [deleteClient] = await conexion.query("DELETE FROM cliente WHERE email = ?", [email])
                if (deleteClient.affectedRows != 0) {

                  res.json({ data: "eliminado" })
                }

              }

            } else {
              const [deleteClient] = await conexion.query("DELETE FROM cliente WHERE email = ?", [email])
              if (deleteClient.affectedRows != 0) {

                res.json({ data: "eliminado" })
              }
            }


          }
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.json(error)
  }
}