import conexion from "../database/db.js";
import { uploadImage } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { TOKEN_CODE, TOKEN_EXPIRE, TOKEN_SECRET } from "../config/config.js";

export const imagenPerfil = async (req, res) => {
  try {
    const token = req.headers["token"];
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      let { email } = correo;
      let img;
      if (req.files.img) {
        const result = await uploadImage(req.files.img.tempFilePath);
        console.log(result);
        img = result.secure_url;
      }

      const [result] = await conexion.query(
        "UPDATE cliente SET iconUser=?  WHERE email=?",
        [img, email]
      );
      if (result.affectedRows != 0) {
        return res.json({ data: "INSERT_OK" });
      } else {
        return res.json({ data: "ERROR", error });
      }
    }
  } catch (error) {
    return res.status(404).json({ message: "ERROR 404" });
  }
};

export const createPostTextos = async (req, res) => {
  try {
    const { email } = req.params;
    let likes = 0;
    const { description, textos } = req.body;

    const [result] = await conexion.query(
      "INSERT INTO publicacionestextos(textos,description,likes) VALUES (?,?,?)",
      [textos, description, likes]
    );

    if (result.affectedRows == 1) {
      let id = result.insertId;
      console.log(id);
      const [resulta] = await conexion.query(
        "INSERT INTO publicacionestextos_cliente(email4,id3) VALUES (?,?) ",
        [email, id]
      );
      if (resulta.affectedRows != 0) {
        const [users] = await conexion.query("SELECT email FROM cliente");
        let estado = "nomegusta";
        for (let i = 0; i < users.length; i++) {
          let emailsUsers = users[i].email;

          await conexion.query(
            "INSERT INTO megustatextos(id_textos,email_cliente2,estado) VALUES(?,?,?)",
            [id, emailsUsers, estado]
          );
        }

        return res.json({ data: "BIEN" });
      } else {
        return res.json("ERROR");
      }
    } else {
      return res.json("ERROR");
    }
  } catch (error) {
    return res.json({ message: "ERROR 404" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { email } = req.params;
    const [validatePosts] = await conexion.query(
      "SELECT COUNT(id2) AS contador FROM publicaciones_cliente WHERE email3 = ? ",
      [email]
    );
    
    if (validatePosts[0].contador <= 100) {
      let likes = 0;
      const { description } = req.body;

      let img;
      if (req.files.img) {
        const result = await uploadImage(req.files.img.tempFilePath);
        console.log(result);
        img = result.secure_url;
      }

      const [result] = await conexion.query(
        "INSERT INTO publicaciones(img,description,likes)   VALUES (?,?,?)",
        [img, description, likes]
      );
      if (result.affectedRows != 0) {
        let id = result.insertId;
        const [resulta] = await conexion.query(
          "INSERT INTO publicaciones_cliente(email3,id2) VALUES (?,?)",
          [email, id]
        );
        if (resulta.affectedRows != 0) {
          let estado = "nomegusta";
          const [respu] = await conexion.query(
            "INSERT INTO megusta(id_megusta,email_megusta,estado) VALUES(?,?,?)",
            [id, email, estado]
          );
          if (respu.affectedRows != 0) {
            return res.json({ data: "BIEN", respu });
          }
        }
      } else {
        return res.json({ data: "ERROR", error });
      }
    }else{
      res.json({data:"No disponible"})
    }
  } catch {
    res.status(404).json({ message: "ERROR 404" });
  }
};

export const likesImg = async (req, res) => {
  const token = req.headers["token"];

  try {
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      const { email } = correo;
      const { id } = req.body;
      let estado = "megusta";
      const [result] = await conexion.query(
        "SELECT email_megusta from megusta WHERE email_megusta=? && id_megusta=?",
        [email, id]
      );

      if (result.length > 0) {
        const [resultado] = await conexion.query(
          "UPDATE megusta set estado=? WHERE email_megusta=? && id_megusta=?",
          [estado, email, id]
        );
        if (resultado.affectedRows == 1) {
          const [rest] = await conexion.query(
            "SELECT likes FROM publicaciones WHERE id=?",[id]
          );
          if (rest.length!=0) {
            let like=rest[0].likes
           const [likeFinal]=await conexion.query("UPDATE publicaciones SET likes=? WHERE id=?",
            [like+1, id]) 
            if (likeFinal.affectedRows==1) {
              res.json('bien like Final')
            }
          } else {
            res.json("mal el like");
          }
        } else {
          res.json("mal");
        }
      } else {
        let estado = "megusta";
        const [resulti] = await conexion.query(
          "INSERT megusta(id_megusta,email_megusta,estado) VALUES (?,?,?)",
          [id, email, estado]
        );
        if (resulti.affectedRows == 1) {
          const [rest] = await conexion.query(
            'SELECT likes FROM publicaciones WHERE id=?',[id]
          );
          if (rest.length != 0) {
            let like=rest[0].likes
            const [likeFinal]=await conexion.query("UPDATE publicaciones SET likes=? WHERE id=?",
             [like+1, id]) 
             if (likeFinal.affectedRows==1) {
               res.json('bien like Final')
             }
          } else {
            res.json("mal el like");
          }
        } else {
          res.json("mal");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const likesTexts = async (req, res) => {
  try {
    let token = req.headers["token"];
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      let { email } = correo;
      const { id } = req.body;
      let estado = "megusta";
      const [result] = await conexion.query(
        "SELECT email_cliente2 from megustatextos WHERE email_cliente2=? && id_textos=?",
        [email, id]
      );

      if (result.length > 0) {
        const [resultado] = await conexion.query(
          "UPDATE megustatextos SET estado=? WHERE email_cliente2=? && id_textos=?",
          [estado, email, id]
        );
        if (resultado.affectedRows == 1) {
          const [rest] = await conexion.query(
            'SELECT likes FROM publicacionestextos WHERE id=?',[id]
          );
          if (rest.length != 0) {
           let like=rest[0].likes
           const [likeFinal]=await conexion.query("UPDATE publicacionestextos SET likes=? WHERE id=?",
           [like+1, id])
           if (likeFinal.affectedRows==1) {
            res.json('bien like final')
           }

          } else {
            res.json("mal el like");
          }
        } else {
          res.json("mal");
        }
      } else {
        let estado = "megusta";
        const [resulti] = await conexion.query(
          "INSERT megustatextos(id_textos,email_cliente2,estado) VALUES (?,?,?)",
          [id, email, estado]
        );
        if (resulti.affectedRows == 1) {
          const [rest] = await conexion.query(
            'SELECT likes FROM publicacionestextos WHERE id=?',[id]
          );
          if (rest.length != 0) {
           let like=rest[0].likes
           const [likeFinal]=await conexion.query("UPDATE publicacionestextos SET likes=? WHERE id=?",
           [like+1, id])
           if (likeFinal.affectedRows==1) {
            res.json('bien like final')
           }

          }  else {
            res.json("mal el like");
          }
        } else {
          res.json("mal");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const DontLikeText = async (req, res) => {
  try {
    let token = req.headers["token"];
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      let { email } = correo;
      let { id } = req.body;
      let estado = "nomegusta";
      const [result] = await conexion.query(
        "UPDATE megustatextos SET estado=? WHERE email_cliente2=? && id_textos=?",
        [estado, email, id]
      );
      if (result.affectedRows == 1) {
        const [rest] = await conexion.query(
          'SELECT likes FROM publicacionestextos WHERE id=?',[id]
        );
        if (rest.length != 0) {
         let like=rest[0].likes
         const [likeFinal]=await conexion.query("UPDATE publicacionestextos SET likes=? WHERE id=?",
         [like-1, id])
         if (likeFinal.affectedRows==1) {
          res.json('bien like final')
         }

        }  else {
          res.json("mal el dislike");
        }
      } else {
        res.json("mal dislike");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const DontLike = async (req, res) => {
  try {
    const token = req.headers["token"];
    if (token) {
      let correo = jwt.verify(token, TOKEN_SECRET);
      const { email } = correo;
      let { id } = req.body;
      let estado = "nomegusta";
      const [result] = await conexion.query(
        "UPDATE megusta SET estado=? WHERE email_megusta=? && id_megusta=?",
        [estado, email, id]
      );
      if (result.affectedRows == 1) {
        const [rest] = await conexion.query(
          "SELECT likes FROM publicaciones WHERE id=?",[id]
        );
        if (rest.length!=0) {
          let like=rest[0].likes
         const [likeFinal]=await conexion.query("UPDATE publicaciones SET likes=? WHERE id=?",
          [like-1, id]) 
          if (likeFinal.affectedRows==1) {
            res.json('bien like Final')
          }
        } else {
          res.json("mal el dislike");
        }
      } else {
        res.json("mal dislike");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const DeletePost = async (req, res) => {
  let { id } = req.params;
  const [result] = await conexion.query(
    "SELECT id_megusta FROM megusta WHERE id_megusta=?",
    [id]
  );

  if (result.length > 0) {
    const [result] = await conexion.query(
      "DELETE FROM megusta WHERE id_megusta=?",
      [id]
    );
    if (result.affectedRows != 0) {
      const [result] = await conexion.query(
        "SELECT idimagen FROM comentarios_imagen WHERE idimagen=?",
        [id]
      );
      if (result.length > 0) {
        const [result] = await conexion.query(
          "DELETE FROM comentarios_imagen WHERE idimagen=?",
          [id]
        );
        if (result.affectedRows != 0) {
          const [result] = await conexion.query(
            "DELETE FROM publicaciones_cliente WHERE id2=?",
            [id]
          );
          if (result.affectedRows != 0) {
            const [result] = await conexion.query(
              "DELETE FROM publicaciones WHERE id=?",
              [id]
            );
            if (result.affectedRows != 0) {
              res.json("bien eliminada");
            }
          }
        }
      }
    }
  } else {
    const [result] = await conexion.query(
      "SELECT idimagen FROM comentarios_imagen WHERE idimagen=?",
      [id]
    );
    if (result.length > 0) {
      const [result] = await conexion.query(
        "DELETE FROM comentarios_imagen WHERE idimagen=?",
        [id]
      );
      if (result.affectedRows != 0) {
        const [result] = await conexion.query(
          "DELETE FROM publicaciones_cliente WHERE id2=?",
          [id]
        );
        if (result.affectedRows != 0) {
          const [result] = await conexion.query(
            "DELETE FROM publicaciones WHERE id=?",
            [id]
          );
          if (result.affectedRows != 0) {
            res.json("bien eliminada");
          }
        }
      }
    } else {
      const [result] = await conexion.query(
        "DELETE FROM publicaciones_cliente WHERE id2=?",
        [id]
      );
      if (result.affectedRows != 0) {
        const [result] = await conexion.query(
          "DELETE FROM publicaciones WHERE id=?",
          [id]
        );
        if ((result.affectedRows = !0)) {
          res.json("bien eliminada");
        }
      }
    }
  }
};

export const UpdateText = async (req, res) => {
  let { id } = req.params;
  let { text } = req.body;
  console.log(text);
  const [result] = await conexion.query(
    "UPDATE publicacionestextos SET textos=? WHERE id=?",
    [text, id]
  );
  if (result.affectedRows != 0) {
    res.json("bien actualizado");
  }
};

export const DeletePostText = async (req, res) => {
  let { id } = req.params;
  const [result] = await conexion.query(
    "SELECT id_textos FROM megustatextos WHERE id_textos=?  ",
    [id]
  );

  if (result.length > 0) {
    const [result] = await conexion.query(
      "DELETE FROM megustatextos WHERE id_textos=?  ",
      [id]
    );
    if (result.affectedRows != 0) {
      const [result] = await conexion.query(
        "SELECT idtextos FROM comentarios_textos WHERE idtextos=?  ",
        [id]
      );
      if (result.length > 0) {
        const [result] = await conexion.query(
          "DELETE FROM comentarios_textos WHERE idtextos=?  ",
          [id]
        );
        if (result.affectedRows != 0) {
          const [result] = await conexion.query(
            "DELETE FROM publicacionestextos_cliente WHERE id3=?",
            [id]
          );
          if (result.affectedRows != 0) {
            const [result] = await conexion.query(
              "DELETE FROM publicacionestextos WHERE id=?",
              [id]
            );
            if (result.affectedRows != 0) {
              res.json("bien eliminada");
            }
          }
        }
      }
    }
  } else {
    const [result] = await conexion.query(
      "SELECT idtextos FROM comentarios_textos WHERE idtextos=?  ",
      [id]
    );
    if (result.length > 0) {
      const [result] = await conexion.query(
        "DELETE FROM comentarios_textos WHERE idtextos=?  or idtextos=NULL",
        [id]
      );
      if (result.affectedRows != 0) {
        const [result] = await conexion.query(
          "DELETE FROM publicacionestextos_cliente WHERE id3=?",
          [id]
        );
        if (result.affectedRows != 0) {
          const [result] = await conexion.query(
            "DELETE FROM publicacionestextos WHERE id=?",
            [id]
          );
          if (result.affectedRows != 0) {
            res.json("bien eliminada");
          }
        }
      }
    } else {
      const [result] = await conexion.query(
        "DELETE FROM publicacionestextos_cliente WHERE id3=?",
        [id]
      );
      if (result.affectedRows != 0) {
        const [result] = await conexion.query(
          "DELETE FROM publicacionestextos WHERE id=?",
          [id]
        );
        if ((result.affectedRows = !0)) {
          res.json("bien eliminada");
        }
      }
    }
  }
};

export const userPosts = async (req, res) => {
  try {
    const { email } = req.params;
    const token = req.headers["token"];

    let correo = jwt.verify(token, TOKEN_SECRET);
    const emails = correo.email;

    if (email == emails) {
      const [result] = await conexion.query(
        " SELECT cliente.profession,publicaciones.comments,publicaciones.img,publicaciones.description,publicaciones.likes,publicaciones.id,cliente.email,cliente.name,cliente.iconUser,publicaciones_cliente.tiempo,megusta.estado FROM cliente,publicaciones,publicaciones_cliente,megusta WHERE publicaciones_cliente.email3=cliente.email && publicaciones_cliente.id2=publicaciones.id && cliente.email=megusta.email_megusta && publicaciones_cliente.id2=megusta.id_megusta && publicaciones_cliente.email3=? ORDER BY publicaciones_cliente.tiempo DESC",
        [email]
      );
      return res.json(result);
    }

    if (email != emails) {
      const [resultu] = await conexion.query(
        " SELECT cliente.profession,publicaciones.comments,publicaciones.img,publicaciones.description,publicaciones.likes,publicaciones.id,cliente.email,cliente.name,cliente.iconUser,publicaciones_cliente.tiempo,megusta.estado FROM cliente,publicaciones,publicaciones_cliente,megusta WHERE publicaciones_cliente.email3=cliente.email && publicaciones_cliente.id2=publicaciones.id && cliente.email=megusta.email_megusta && publicaciones_cliente.id2=megusta.id_megusta && publicaciones_cliente.email3=? ORDER BY publicaciones_cliente.tiempo DESC",
        [email]
      );

      const [response] = await conexion.query(
        "SELECT megusta.estado,megusta.id_megusta,publicaciones.tiempo FROM megusta,publicaciones,publicaciones_cliente WHERE publicaciones.id=megusta.id_megusta AND publicaciones.id=publicaciones_cliente.id2 AND publicaciones_cliente.email3=? AND email_megusta=? ORDER BY publicaciones.tiempo DESC;",
        [email, emails]
      );

      if (response.length == 0) {
        for (let i = 0; i < resultu.length; i++) {
          response.push({
            id_megusta: resultu[i].id,
            estado: "nomegusta",
            tiempo: resultu[i].tiempo,
          });
        }
        return res.json({ data1: resultu, data2: response });
      }

      if (response.length != 0) {
        let array2 = [];
        for (let i = 0; i < resultu.length; i++) {
          let change = false;
          for (let k = 0; k < response.length; k++) {
            if (resultu[i].id == response[k].id_megusta) {
              array2.push({
                id_megusta: resultu[i].id,
                estado: response[k].estado,
                tiempo: resultu[i].tiempo,
              });
              change = true;
            }
          }
          if (change == false) {
            array2.push({
              id_megusta: resultu[i].id,
              estado: "nomegusta",
              tiempo: resultu[i].tiempo,
            });
          }
        }

        return res.json({ data1: resultu, data2: array2 });
      }
    }
  } catch (error) {
    return res.json({ message: "ERROR 404" });
  }
};

export const userPostsTextos = async (req, res) => {
  try {
    const { email } = req.params;
    const token = req.headers["token"];

    let correo = jwt.verify(token, TOKEN_SECRET);
    const emails = correo.email;
    if (email == emails) {
      const [result] = await conexion.query(
        " SELECT publicacionestextos.textos,publicacionestextos.comments,publicacionestextos.description,publicacionestextos.likes,publicacionestextos.id,cliente.email,cliente.name,cliente.iconUser,publicacionestextos_cliente.tiempo,megustatextos.estado FROM cliente,publicacionestextos,publicacionestextos_cliente,megustatextos WHERE publicacionestextos_cliente.email4=cliente.email && publicacionestextos_cliente.id3=publicacionestextos.id && cliente.email=megustatextos.email_cliente2 && publicacionestextos_cliente.id3=megustatextos.id_textos && publicacionestextos_cliente.email4=? ORDER BY publicacionestextos_cliente.tiempo DESC",
        [email]
      );
      res.json(result);
    }
    if (email != emails) {
      const [resultu] = await conexion.query(
        "SELECT publicacionestextos.textos,publicacionestextos.comments,publicacionestextos.description,publicacionestextos.likes,publicacionestextos.id,cliente.email,cliente.name,cliente.iconUser,publicacionestextos_cliente.tiempo,megustatextos.estado FROM cliente,publicacionestextos,publicacionestextos_cliente,megustatextos WHERE publicacionestextos_cliente.email4=cliente.email && publicacionestextos_cliente.id3=publicacionestextos.id && cliente.email=megustatextos.email_cliente2 && publicacionestextos_cliente.id3=megustatextos.id_textos && publicacionestextos_cliente.email4=? ORDER BY publicacionestextos_cliente.tiempo DESC ",
        [email]
      );

      const [response] = await conexion.query(
        "SELECT megustatextos.estado,megustatextos.id_textos,publicacionestextos.tiempo FROM megustatextos,publicacionestextos,publicacionestextos_cliente WHERE publicacionestextos.id=megustatextos.id_textos AND publicacionestextos.id=publicacionestextos_cliente.id3 AND publicacionestextos_cliente.email4=? AND megustatextos.email_cliente2=? ORDER BY publicacionestextos.tiempo DESC;",
        [email, emails]
      );

      /*---------------------------------------------------------------*/
      if (response.length == 0) {
        for (let i = 0; i < resultu.length; i++) {
          response.push({
            id_textos: resultu[i].id,
            estado: "nomegusta",
            tiempo: resultu[i].tiempo,
          });
        }
        return res.json({ data1: resultu, data2: response });
      }

      if (response.length != 0) {
        let array2 = [];
        for (let i = 0; i < resultu.length; i++) {
          let change = false;
          for (let k = 0; k < response.length; k++) {
            if (resultu[i].id == response[k].id_textos) {
              array2.push({
                id_textos: resultu[i].id,
                estado: response[k].estado,
                tiempo: resultu[i].tiempo,
              });
              change = true;
            }
          }
          if (change == false) {
            array2.push({
              id_textos: resultu[i].id,
              estado: "nomegusta",
              tiempo: resultu[i].tiempo,
            });
          }
        }

        return res.json({ data1: resultu, data2: array2 });
      }

      /*---------------------------------------------------------------- */
    }
  } catch (error) {
    return res.status(404).json({ message: "ERROR 404" });
  }
};

export const insertComment = async (req, res) => {
  const token = req.headers["token"];
  if (token) {
    let correo = jwt.verify(token, TOKEN_SECRET);
    const { email } = correo;
    const { coment } = req.body;
    const { id } = req.params;
    const [result] = await conexion.query(
      "INSERT INTO comentarios(comentario) VALUES(?)",
      [coment]
    );
    if (result.affectedRows != 0) {
      const id_comentario = result.insertId;
      const [resultado] = await conexion.query(
        "INSERT INTO comentarios_imagen(id_comentario,idimagen) VALUES(?,?)",
        [id_comentario, id]
      );
      if (resultado.affectedRows != 0) {
        const [response] = await conexion.query(
          "INSERT INTO comentarios_usuario(id_comentario3,emailcliente) VALUES(?,?)",
          [id_comentario, email]
        );
        if (response.affectedRows != 0) {
          const [rest] = await conexion.query(
            'SELECT comments FROM publicaciones WHERE id=?',[id]
          );
          if (rest.length!=0) {
            let commen=rest[0].comments
            const [commentFinal]=await conexion.query("UPDATE publicaciones SET comments=? WHERE id=?",
            [commen+1, id])
            if (commentFinal.affectedRows==1) {
              res.json('se agrego ,un comentario')
            }
          }
        } else {
          res.json("not insert");
        }
      }
    }
  }
};

export const insertCommentText = async (req, res) => {
  const token = req.headers["token"];
  if (token) {
    let correo = jwt.verify(token, TOKEN_SECRET);
    const { email } = correo;
    const { coment } = req.body;
    const { id } = req.params;
    const [result] = await conexion.query(
      "INSERT INTO comentarios(comentario) VALUES(?)",
      [coment]
    );
    if (result.affectedRows != 0) {
      const id_comentario = result.insertId;
      const [resultado] = await conexion.query(
        "INSERT INTO comentarios_textos(id_comentario2,idtextos) VALUES(?,?)",
        [id_comentario, id]
      );
      if (resultado.affectedRows != 0) {
        const [response] = await conexion.query(
          "INSERT INTO comentarios_usuario(id_comentario3,emailcliente) VALUES(?,?)",
          [id_comentario, email]
        );
        if (response.affectedRows != 0) {
          const [rest] = await conexion.query(

            'SELECT comments FROM publicacionestextos WHERE id=?',[id]
          );
          if (rest.length!=0) {
            let commen=rest[0].comments
            const [commentFinal]=await conexion.query("UPDATE publicacionestextos SET comments=? WHERE id=?",
            [commen+1, id])
            if (commentFinal.affectedRows==1) {
               res.json("insert OK");
            }
          }
         
        } else {
          res.json("not insert");
        }
      }
    }
  }
};

export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await conexion.query(
      "SELECT cliente.name,cliente.iconUser,comentarios.comentario,comentarios.id,comentarios_imagen.idimagen,comentarios_usuario.emailcliente FROM comentarios,cliente,comentarios_usuario,comentarios_imagen WHERE comentarios.id=comentarios_usuario.id_comentario3 and comentarios.id=comentarios_imagen.id_comentario AND comentarios.comentario is NOT null and cliente.email=comentarios_usuario.emailcliente and comentarios_imagen.idimagen=? ORDER BY comentarios.hora DESC",
      [id]
    );

    res.json(result);
  } catch (error) {
    console.log(error);
  }
};
export const getCommentsText = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await conexion.query(
      "SELECT cliente.name,cliente.iconUser,comentarios.comentario,comentarios.id,comentarios_textos.idtextos,comentarios_usuario.emailcliente FROM comentarios,cliente,comentarios_usuario,comentarios_textos WHERE comentarios.id=comentarios_usuario.id_comentario3 and comentarios.id=comentarios_textos.id_comentario2 AND comentarios.comentario is NOT null and cliente.email=comentarios_usuario.emailcliente and comentarios_textos.idtextos=? ORDER BY comentarios.hora DESC",
      [id]
    );

    res.json(result);
  } catch (error) {
    console.log(error);
  }
};

export const updateComments = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id } = req.params;
    const [result] = await conexion.query(
      "UPDATE comentarios SET comentarios.comentario=? WHERE comentarios.id=?",
      [comment, id]
    );

    if (result.affectedRows != 0) {
      res.json(result);
    } else {
      res.json("not update");
    }
  } catch (error) {
    console.log(error);
  }
};

export const deleteComments = async (req, res) => {
  try {
    const { param } = req.body;
    const { id } = req.params;
    const [result] = await conexion.query(
      "DELETE FROM comentarios_usuario WHERE id_comentario3=?",
      [id]
    );

    if (result.affectedRows != 0) {
      const [resulti] = await conexion.query(
        "DELETE FROM comentarios_imagen WHERE id_comentario=?",
        [id]
      );
      if (resulti.affectedRows != 0) {
        const [resultu] = await conexion.query(
          "DELETE FROM comentarios WHERE id=?",
          [id]
        );
        if (resultu.affectedRows != 0) {
          const [rest] = await conexion.query(
            // "UPDATE publicaciones SET comments=(SELECT comments FROM publicaciones WHERE id=?)-1 WHERE id=?",
            // [param, param]
           ' SELECT comments FROM publicaciones WHERE id=?',[param]
            
          );

          if (rest.length != 0) {
            let commen=rest[0].comments
           const [commentFinal]=await conexion.query("UPDATE publicaciones SET comments=? WHERE id=?",
            [commen-1, param]) 
            if (commentFinal) {
              res.json('delete comments')
            }
          } else {
            console.log("falla el update");
          }
        }
      }
    } else {
      res.json("not delete");
    }
  } catch (error) {
    console.log(error);
  }
};

export const deleteCommentsText = async (req, res) => {
  try {
    const { id } = req.params;
    const { param } = req.body;

    if (id) {
      const [result] = await conexion.query(
        "DELETE FROM comentarios_usuario WHERE id_comentario3=?",
        [id]
      );

      if (result.affectedRows != 0) {
        const [resulti] = await conexion.query(
          "DELETE FROM comentarios_textos WHERE id_comentario2=?",
          [id]
        );
        if (resulti.affectedRows != 0) {
          const [resultu] = await conexion.query(
            "DELETE FROM comentarios WHERE id=?",
            [id]
          );
          if (resultu.affectedRows != 0) {
            const [rest] = await conexion.query(
              'SELECT comments FROM publicacionestextos WHERE id=?',[param]
            );
            if (rest.length != 0) {
              let commen=rest[0].comments
              const [commentsFinal]=await conexion.query("UPDATE publicacionestextos SET comments=? WHERE id=?",
              [commen-1, param])
              if (commentsFinal.affectedRows==1) {
                res.json('delete ok')
              }
            }
          }
        }
      }
    } else {
      res.json("not delete");
    }
  } catch (error) {
    console.log(error);
  }
};
