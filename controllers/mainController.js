const modulepdfgenerator = require('../functions/pdf_generator');

const controller = {};

controller.login = (req, res) => {
  var rut  = req.body.rut;
  var pass = req.body.pass;
  console.log(pass);
  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM votante WHERE rut = ?', [rut], (err, rows) => {
      console.log(rows);
      if(rows!=undefined){
          if (rows.length>0){
            if(rows[0].clave == pass){
              req.session.user = rows[0];
              res.redirect('/votaciones');
            }else{
              res.render('home', {
                denied: true
              });
            }
          }else{
            res.render('home', {
              denied: true
            });
          }
      }else{
        res.redirect('/');
      }
    });
  });
};

controller.votaciones = (req, res) => {
  var user_s  = req.session.user;
  var votaciones_f = [];
  if (user_s===undefined){
    res.redirect('/');
  }else{
    var votaciones_u = user_s.votaciones.split(",");
    for(i = 0; i < votaciones_u.length; i++){
      var id_votacion = parseInt(votaciones_u[i]);
      votaciones_f.push(id_votacion);
    }
    console.log(votaciones_f);
    req.getConnection((err, conn) => {
      conn.query('SELECT v.id as id_votacion, v.nombre as nombre FROM votacion v LEFT JOIN voto vv ON v.id=vv.id_votacion WHERE v.id IN (?) AND vv.id_votante = (?)', [votaciones_f,user_s.id], (err, rows_vv) => {
        console.log(rows_vv);
        if (err) {
          console.log(err);
          res.redirect('/');
        }else{
          conn.query('SELECT * FROM votacion WHERE id IN (?) ', [votaciones_f], (err, rows_v) => {
            console.log(rows_v);
            if (err) {
              console.log(err);
              res.redirect('/');
            }else{
              res.render('votaciones',{
                user: user_s, votaciones: rows_v, votaciones_v: rows_vv
              });
            }
          });
        }
      });
    });
  }
};

controller.votacion = (req, res) => {
  var user_s  = req.session.user;
  var id  = req.params.id;
  var candidatos_f = [];
  if (user_s===undefined){
    res.redirect('/');
  }else{
    req.getConnection((err, conn) => {
      conn.query('SELECT * FROM votacion WHERE id = ?', [id], (err, rows_v) => {
        console.log(rows_v);
        if (err) {
          console.log(err);
          res.redirect('/');
        }else{
          var candidatos_v = rows_v[0].candidatos.split(",");
          for(i = 0; i < candidatos_v.length; i++){
            var id_candidato = parseInt(candidatos_v[i]);
            candidatos_f.push(id_candidato);
          }
          console.log(candidatos_f);
          conn.query('SELECT * FROM candidato WHERE id IN (?) ORDER BY apellido ASC, nombre ASC', [candidatos_f], (err, rows_c) => {
            if (err) {
              console.log(err);
              res.redirect('/');
            }else{
              res.render('votacion',{
                user: user_s, votacion: rows_v[0], candidatos: rows_c
              }); 
            }
          });
        }
      });
    });
  }
};

controller.save_votacion = (req, res) => {
  var id_v = req.body.id_v;
  var id_user = req.body.id_user;
  var votos = req.body.votos;
  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM voto WHERE id_votacion = ? AND id_votante = ?', [id_v,id_user], (err, rows) => {
      if(rows!=undefined){
          if (rows.length>0){
            res.send("EXISTE");
          }else{
            conn.query('INSERT INTO voto VALUES (NULL,?,?,?,?)', [id_v,id_user,votos,new Date()], (err, insert_r) => {
              if (err) {
                console.log(err);
               }
               res.send("EXITO");
            });
          }
      }else{
        if (err) {
          res.json(err);
          res.send("ERROR");
         }
      }
    });
  })
};

controller.comprobante = (req, res) => {
  var nombre_user=req.body.n_u;
  var id_user=req.body.id_u;
  var nombre_votacion=req.body.n_v;
  var votacion=req.body.votacion;
  modulepdfgenerator.comprobante(id_user,nombre_user,nombre_votacion,votacion);
  res.send("EXITO");
};

controller.votaciones_r = (req, res) => {
    req.getConnection((err, conn) => {
          conn.query('SELECT * FROM votacion WHERE estado=1', (err, rows_v) => {
            console.log(rows_v);
            if (err) {
              console.log(err);
              res.redirect('/');
            }else{
              res.render('dashboard',{
                votaciones: rows_v
              });
            }
          });
    });
};

controller.votaciones_rr = (req, res) => {
  var votacion_get = req.params.id;
  var candidatos_f = [];
  console.log(votacion_get);
  req.getConnection((err, conn) => {
        conn.query('SELECT * FROM votacion WHERE id=?', [votacion_get], (err, rows_v) => {
          console.log(rows_v);
          if (err) {
            console.log(err);
            res.redirect('/');
          }else{
            conn.query('SELECT * FROM voto WHERE id_votacion=?',[votacion_get],(err, rows_vv) => {
              console.log(rows_vv);
              if (err) {
                console.log(err);
                res.redirect('/');
              }else{
                var candidatos_v = rows_v[0].candidatos.split(",");
                for(i = 0; i < candidatos_v.length; i++){
                  var id_candidato = parseInt(candidatos_v[i]);
                  candidatos_f.push(id_candidato);
                }
                console.log(candidatos_f);
                conn.query('SELECT * FROM candidato WHERE id IN (?) ORDER BY apellido ASC, nombre ASC', [candidatos_f], (err, rows_c) => {
                  if (err) {
                    console.log(err);
                    res.redirect('/');
                  }else{
                    conn.query('SELECT COUNT(*) as cant FROM `votacion` as v JOIN `voto` as vv ON v.id = vv.id_votacion WHERE v.estado=1 AND v.id = ?', [parseInt(votacion_get)], (err, rows_cant_v) => {
                      if (err) {
                        console.log(err);
                        res.redirect('/');
                      }else{
                        conn.query('SELECT count(*) as cant FROM `votante` WHERE votaciones LIKE ?', ["%"+votacion_get+"%"], (err, rows_cant_t) => {
                          if (err) {
                            console.log(err);
                            res.redirect('/');
                          }else{
                            console.log(rows_cant_t);
                            console.log(rows_cant_v);
                            res.render('votaciones-results',{
                              votacion: rows_v[0], votos: rows_vv, candidatos: rows_c, totales: rows_cant_t[0],votaron: rows_cant_v[0] 
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
  });
};

controller.exportvotacion = (req, res) => {

  var votacion_get = req.params.id;
  var candidatos_f = [];
  var votacion_r =[];
  var votos_r=[];
  var candidatos_r=[];
  var usuarios_r=[];
  console.log(votacion_get);
  req.getConnection((err, conn) => {
        conn.query('SELECT * FROM votacion WHERE id=?', [votacion_get], (err, rows_v) => {
          if (err) {
            console.log(err);
            res.redirect('/');
          }else{
            votacion_r =  rows_v[0]; 
            conn.query('SELECT * FROM voto WHERE id_votacion=?',[votacion_get],(err, rows_vv) => {
              if (err) {
                console.log(err);
                res.redirect('/');
              }else{
                votos_r= rows_vv; 
                var candidatos_v = rows_v[0].candidatos.split(",");
                for(i = 0; i < candidatos_v.length; i++){
                  var id_candidato = parseInt(candidatos_v[i]);
                  candidatos_f.push(id_candidato);
                }
                conn.query('SELECT * FROM candidato WHERE id IN (?) ORDER BY apellido ASC, nombre ASC', [candidatos_f], (err, rows_c) => {
                  if (err) {
                    console.log(err);
                    res.redirect('/');
                  }else{
                    conn.query('SELECT * FROM votante', [candidatos_f], (err, rows_user) => {
                      candidatos_r= rows_c;
                      usuarios_r=rows_user;
                      console.log(votos_r);
  console.log(candidatos_r);
  var resultados_re = [];
  var resultados_finales_re = [];
  var totalescandidato_re = 0;
  

const excel = require('node-excel-export');

const specification = {
  votante: { // <- the key should match the actual data key
    displayName: 'Votante',
    width: 200 // <- width in pixels
  },
  votos: {
    displayName: 'Votos',
    width: 50// <- width in chars (when the number is passed as string)
  },
  candidato: {
    displayName: 'Candidato',
    width: 200 // <- width in pixels
  }
}

const dataset = [];

for(i = 0; i < votos_r.length;i++){
  var resultados_in = votos_r[i].votos.split(";");
  for(j = 0; j < resultados_in.length;j++){
    resultados_re.push([resultados_in[j],votos_r[i].id_votante]);
  }
}
for(i = 0; i < candidatos_r.length;i++){
totalescandidato_re = 0;
  for (j = 0; j < resultados_re.length;j++){
      var resultado_detalle = resultados_re[j][0].split(",");
      if(resultado_detalle[0]==candidatos_r[i].id){
        for(l = 0; l < usuarios_r.length;l++){
          if (usuarios_r[l].id==resultados_re[j][1]){
            dataset.push({votante: usuarios_r[l].nombre,votos: parseInt(resultado_detalle[1]), candidato: candidatos_r[i].nombre+" "+candidatos_r[i].apellido});
          }
        }
       
        totalescandidato_re = totalescandidato_re+parseInt(resultado_detalle[1]);
      }
  }
  resultados_finales_re.push([candidatos_r[i].nombre+" "+candidatos_r[i].apellido,totalescandidato_re]);
}



totalescandidato_re = 0;
for (j = 0; j < resultados_re.length;j++){
  var resultado_detalle = resultados_re[j][0].split(",");
  if(resultado_detalle[0]=="BLANCO"){
    for(l = 0; l < usuarios_r.length;l++){
      if (usuarios_r[l].id==resultados_re[j][1]){
        dataset.push({votante: usuarios_r[l].nombre,votos: parseInt(resultado_detalle[1]), candidato:  "BLANCO"});
      }
    }
    totalescandidato_re = totalescandidato_re+parseInt(resultado_detalle[1]);
  }
}
resultados_finales_re.push(["BLANCO",totalescandidato_re]);

totalescandidato_re = 0;
for (j = 0; j < resultados_re.length;j++){
  var resultado_detalle = resultados_re[j][0].split(",");
  if(resultado_detalle[0]=="NULO"){
    for(l = 0; l < usuarios_r.length;l++){
      if (usuarios_r[l].id==resultados_re[j][1]){
        dataset.push({votante: usuarios_r[l].nombre,votos: parseInt(resultado_detalle[1]), candidato: "NULO"});
      }
    }
    totalescandidato_re = totalescandidato_re+parseInt(resultado_detalle[1]);
  }
}
resultados_finales_re.push(["NULO",totalescandidato_re]);

 
// Create the excel report.
// This function will return Buffer
const report = excel.buildExport(
  [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
    {
      name: 'Report', // <- Specify sheet name (optional)
      specification: specification,
      data: dataset // <-- Report data
    }
  ]
);
 
// You can then return this straight
res.attachment('report.xlsx'); // This is sails.js specific (in general you need to set headers)
return res.send(report);
                    
                    });
                    
                  }
                });
              }
            });
          }
        });
  });
}
/*
controller.save = (req, res) => {
  const data = req.body;
  console.log(req.body)
  req.getConnection((err, connection) => {
    const query = connection.query('INSERT INTO customer set ?', data, (err, customer) => {
      console.log(customer)
      res.redirect('/');
    })
  })
};

controller.edit = (req, res) => {
  const { id } = req.params;
  req.getConnection((err, conn) => {
    conn.query("SELECT * FROM customer WHERE id = ?", [id], (err, rows) => {
      res.render('customers_edit', {
        data: rows[0]
      })
    });
  });
};



controller.update = (req, res) => {
  const { id } = req.params;
  const newCustomer = req.body;
  req.getConnection((err, conn) => {

  conn.query('UPDATE customer set ? where id = ?', [newCustomer, id], (err, rows) => {
    res.redirect('/');
  });
  });
};

controller.delete = (req, res) => {
  const { id } = req.params;
  req.getConnection((err, connection) => {
    connection.query('DELETE FROM customer WHERE id = ?', [id], (err, rows) => {
      res.redirect('/');
    });
  });
}
*/
module.exports = controller;
