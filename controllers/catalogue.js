import { TOKEN_SECRET } from "../config/config.js";
import conexion from "../database/db.js";
import jwt from "jsonwebtoken";
export const consultProfessional = async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.json({ data: "error" });
  }

  try {
    const encoder = new TextEncoder();
    const jwtData = await jwtVerify(
      authorization,
      encoder.encode(TOKEN_SECRET)
    );

    if (jwtData.payload) {
      const [result] = await conexion.query(
        "SELECT email, iconUser, name, profession FROM cliente"
      );
      res.json({ data: result });
    }
  } catch (error) {
    res.send(error);
  }
};

export const consultTarget = async (req, res) => {
  try {
    const token=req.headers['token']

    if (token) {
      let correo=jwt.verify(token,TOKEN_SECRET)
      let {email}=correo
      const [result] = await conexion.query(
    "SELECT email, iconUser, name, profession FROM cliente WHERE email != ? AND  email NOT LIKE '%@facejob.com' ORDER BY rand() LIMIT 4",[email]
    );
    res.json(result);
    }else{
      const [result] = await conexion.query(
        "SELECT email, iconUser, name, profession FROM cliente WHERE  email NOT LIKE '%@facejob.com' ORDER BY rand() LIMIT 4"
        );
        res.json(result);
    }

    
  } catch (error) {
    console.log(error);
    res.json(error)
  }
  
};

export const consultCategories = async (req, res) => {

  try {
    const token=req.headers['token']

  if (token) {
    let correo=jwt.verify(token,TOKEN_SECRET)
    let {email}=correo
    let {profession} = req.params;
  
  const [result] = await conexion.query(
    `SELECT name,email,profession,iconUser FROM cliente WHERE email!=? and profession=?`,
    [email,profession]
  );

  return res.json(result);
  }else{
    let {profession} = req.params;
    const [result] = await conexion.query(
      `SELECT name,email,profession,iconUser FROM cliente WHERE profession=?`,
      [profession]
    );
  
    return res.json(result);
  }
  } catch (error) {
    console.log(error);
  }
  
};

export const consultProfile = async (req, res) => {
  let {email} = req.params;
  const [result] = await conexion.query(
    "SELECT email,name,lastname,number,profession,iconUser FROM cliente WHERE email = ?",
    [email]
  );
  return res.json(result);
};

export const consultViews = async (req, res) => {

  try {
    const token=req.headers['token']

    if (token) {
      let correo=jwt.verify(token,TOKEN_SECRET)
      let {email}=correo

      const [result] = await conexion.query(`SELECT email_visto FROM profesionales_vistos WHERE email_cliente = ?`,[email])
      
      if (result.length>0) {
        let emailView = []
        let usersView =[]
        for (let i = 0; i < result.length; i++) {
          emailView.push(result[i].email_visto)
        }
        for (let i = 0; i < emailView.length; i++) {
          const [info] = await conexion.query('SELECT name,email,profession,iconUser FROM cliente WHERE email=?',[emailView[i]]);
          if (info.length > 0) {
            usersView.push(info[0])
          }
        }
        res.json(usersView);
      }else{
        res.json("no views")
      }
      
    }else{
      res.json("no views")
    }
    
  } catch (error) {
    console.log(error);
  }
  
};

export const postCategories = async (req,res) =>{
 try {
  const token=req.headers['token']
  if (token) {
    let correo=jwt.verify(token,TOKEN_SECRET)
    let {email}=correo
    let emails = []
    let posts = []
    let emailProfile;
    let i =0;
    let j =0;
    let k =0;
    let l =0;
    let p=0;
    let m=0;

    let email1;
    let consultPrueba;
    let consultPruebas;
    let persona;
    let personas;
    do {
      [email1] =await conexion.query("SELECT email FROM cliente WHERE profession='Desarrollador de software' AND email != ? ORDER BY rand() LIMIT 2",[email]);
      if (email1.length > 0) {
        persona = email1[0].email
        if (email1.length > 1) {
           personas = email1[1].email
          
        }
      }
      [consultPrueba] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona]);
       [consultPruebas] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas]);
      i++
    } while (consultPrueba.length == 0 && consultPruebas.length == 0 && i < 5);

    let email2;
    let consultPrueba2;
    let consultPruebas2;
    let persona2;
    let personas2;
    do {
      [email2] =await conexion.query("SELECT email FROM cliente WHERE profession='Diseñador grafico' AND email != ? ORDER BY rand() LIMIT 2",[email]);
      if (email2.length > 0) {
        persona2 = email2[0].email
        if (email2.length > 1) {
          personas2 = email2[1].email
         
        }
        
      }
      [consultPrueba2] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona2]);
       [consultPruebas2] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas2]);
      j++
    } while (consultPrueba2.length == 0 && consultPruebas2.length == 0 && j < 5);

    let email3;
    let consultPrueba3;
    let consultPruebas3;
    let persona3;
    let personas3;
    do {
      [email3] =await conexion.query("SELECT email FROM cliente WHERE profession='Coach personal' AND email != ? ORDER BY rand() LIMIT 2",[email]);
      if (email3.length > 0) {
        persona3 = email3[0].email
        if (email3.length > 1) {
          personas3 = email3[1].email
          
        }
        
      }
      [consultPrueba3] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona3]);
      [consultPruebas3] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas3]);
      k++
    } while (consultPrueba3.length == 0 && consultPruebas3.length == 0  && k < 5);
    
    let email4;
    let consultPrueba4;
    let persona4;
    let consultPruebas4;
    let personas4;
    do {
      [email4] =await conexion.query("SELECT email FROM cliente WHERE profession='Desarrollador de aplicaciones moviles' AND email != ? ORDER BY rand() LIMIT 2",[email]);
      if (email4.length > 0) {
        persona4 = email4[0].email
        if (email4.length > 1) {
          personas4 = email4[1].email
          
        }
        
      }
      [consultPrueba4] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona4]);
      [consultPruebas4] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas4]);
      l++
    } while (consultPrueba4.length == 0 && consultPruebas4.length == 0 && l < 5);
    
    let email5;
    let consultPrueba5;
    let persona5;
    let consultPruebas5;
    let personas5;
    do {
      [email5] =await conexion.query("SELECT email FROM cliente WHERE profession='Diseñador de interiores' AND email != ? ORDER BY rand() LIMIT 2",[email]);
      if (email5.length > 0) {
        persona5 = email5[0].email
        if (email5.length > 1) {
          personas5 = email5[1].email
         
        }
        
      }
      [consultPrueba5] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona5]);
       [consultPruebas5] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas5]);
      p++
    } while (consultPrueba5.length == 0 && consultPruebas5.length == 0 && l < 5);

    let email6;
    let consultPrueba6;
    let persona6;
    let consultPruebas6;
    let personas6;
    do {
      [email6] =await conexion.query("SELECT email FROM cliente WHERE profession='Fotografo' AND email != ? ORDER BY rand() LIMIT 2",[email]);
      if (email6.length > 0) {
        persona6 = email6[0].email
        if (email6.length > 1) {
          personas6 = email6[1].email
          
        }
        
      }
      [consultPrueba6] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona6]);
      [consultPruebas6] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona6]);
      m++
    } while (consultPrueba6.length == 0 && consultPruebas6.length == 0 && l < 5);

    emails.push(persona,personas,persona2,personas2,persona3,personas3,persona4,personas4,persona5,personas5,persona6,personas6)

    for (let i = 0; i < emails.length; i++) {
      emailProfile = emails[i]
      const [resultPost] = await conexion.query("SELECT cliente.email,cliente.name,cliente.profession,cliente.iconUser,publicaciones.id,publicaciones.img,publicaciones.description FROM publicaciones INNER JOIN publicaciones_cliente ON publicaciones.id = publicaciones_cliente.id2 INNER JOIN cliente ON publicaciones_cliente.email3 = cliente.email WHERE cliente.email = ? ORDER BY publicaciones.likes DESC LIMIT 1",[emailProfile])
      posts.push(resultPost[0])
    }
    res.json(posts)

  } else {
    let emails = []
    let posts = []
    let emailProfile;
    let i =0;
    let j =0;
    let k =0;
    let l =0;
    let p=0;
    let m=0;

    let email1;
    let consultPrueba;
    let consultPruebas;
    let persona;
    let personas;
    do {
      [email1] =await conexion.query("SELECT email FROM cliente WHERE profession='Desarrollador de software' ORDER BY rand() LIMIT 2",);
      if (email1.length > 0) {
        persona = email1[0].email
        if (email1.length > 1) {
           personas = email1[1].email
          
        }
      }
      [consultPrueba] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona]);
       [consultPruebas] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas]);
      i++
    } while (consultPrueba.length == 0 && consultPruebas.length == 0 && i < 5);

    let email2;
    let consultPrueba2;
    let consultPruebas2;
    let persona2;
    let personas2;
    do {
      [email2] =await conexion.query("SELECT email FROM cliente WHERE profession='Diseñador grafico' ORDER BY rand() LIMIT 2",);
      if (email2.length > 0) {
        persona2 = email2[0].email
        if (email2.length > 1) {
          personas2 = email2[1].email
         
        }
        
      }
      [consultPrueba2] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona2]);
       [consultPruebas2] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas2]);
      j++
    } while (consultPrueba2.length == 0 && consultPruebas2.length == 0 && j < 5);

    let email3;
    let consultPrueba3;
    let consultPruebas3;
    let persona3;
    let personas3;
    do {
      [email3] =await conexion.query("SELECT email FROM cliente WHERE profession='Coach personal' ORDER BY rand() LIMIT 2",);
      if (email3.length > 0) {
        persona3 = email3[0].email
        if (email3.length > 1) {
          personas3 = email3[1].email
          
        }
        
      }
      [consultPrueba3] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona3]);
      [consultPruebas3] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas3]);
      k++
    } while (consultPrueba3.length == 0 && consultPruebas3.length == 0  && k < 5);
    
    let email4;
    let consultPrueba4;
    let persona4;
    let consultPruebas4;
    let personas4;
    do {
      [email4] =await conexion.query("SELECT email FROM cliente WHERE profession='Desarrollador de aplicaciones moviles' ORDER BY rand() LIMIT 2",);
      if (email4.length > 0) {
        persona4 = email4[0].email
        if (email4.length > 1) {
          personas4 = email4[1].email
          
        }
        
      }
      [consultPrueba4] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona4]);
      [consultPruebas4] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas4]);
      l++
    } while (consultPrueba4.length == 0 && consultPruebas4.length == 0 && l < 5);
    
    let email5;
    let consultPrueba5;
    let persona5;
    let consultPruebas5;
    let personas5;
    do {
      [email5] =await conexion.query("SELECT email FROM cliente WHERE profession='Diseñador de interiores' ORDER BY rand() LIMIT 2",);
      if (email5.length > 0) {
        persona5 = email5[0].email
        if (email5.length > 1) {
          personas5 = email5[1].email
         
        }
        
      }
      [consultPrueba5] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona5]);
       [consultPruebas5] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[personas5]);
      p++
    } while (consultPrueba5.length == 0 && consultPruebas5.length == 0 && l < 5);

    let email6;
    let consultPrueba6;
    let persona6;
    let consultPruebas6;
    let personas6;
    do {
      [email6] =await conexion.query("SELECT email FROM cliente WHERE profession='Fotografo' ORDER BY rand() LIMIT 2",);
      if (email6.length > 0) {
        persona6 = email6[0].email
        if (email6.length > 1) {
          personas6 = email6[1].email
          
        }
        
      }
      [consultPrueba6] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona6]);
      [consultPruebas6] = await conexion.query("SELECT * FROM publicaciones_cliente WHERE email3 = ?",[persona6]);
      m++
    } while (consultPrueba6.length == 0 && consultPruebas6.length == 0 && l < 5);

    emails.push(persona,personas,persona2,personas2,persona3,personas3,persona4,personas4,persona5,personas5,persona6,personas6)

    for (let i = 0; i < emails.length; i++) {
      emailProfile = emails[i]
      const [resultPost] = await conexion.query("SELECT cliente.email,cliente.name,cliente.profession,cliente.iconUser,publicaciones.id,publicaciones.img,publicaciones.description FROM publicaciones INNER JOIN publicaciones_cliente ON publicaciones.id = publicaciones_cliente.id2 INNER JOIN cliente ON publicaciones_cliente.email3 = cliente.email WHERE cliente.email = ? ORDER BY publicaciones.likes DESC LIMIT 1",[emailProfile])
      posts.push(resultPost[0])
    }
    res.json(posts)
  }
  
 } catch (error) {
  console.log(error);
  res.json(error)
 }
  
}