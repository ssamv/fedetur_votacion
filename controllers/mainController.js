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
