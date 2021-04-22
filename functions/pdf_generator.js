const PDFDocument = require('pdfkit');
const fs = require('fs');


var comprobante = function(id_user,n_u,n_v,votacion){
// Create a document
const doc = new PDFDocument({size: 'LETTER'});

// Pipe its output somewhere, like to a file or HTTP response
// See below for browser usage
doc.pipe(fs.createWriteStream('public/pdf/comprobantes_votos/comprobante_'+id_user+'_'+votacion+'.pdf'));

// Embed a font, set the font size, and render some text

  /*.font('fonts/PalatinoBold.ttf')*/
  doc.image('public/img/LOGO_FEDETUR.png',50,50,{fit: [200, 200], align: 'center', valign: 'center'});

  doc.moveDown(15);

  doc
  .fontSize(15)
  .text(`Comprobante de la votación por `+n_v+`.`,100,250);

  doc
  .fontSize(15)
  .text(`Realizada exitosamente por `+n_u+`.`,100,300);

  doc
  .fontSize(13)
  .text(`Votaciones Swaper.`,100,400);
// Add an image, constrain it to a given size, and center it vertically and horizontally


// Finalize PDF file
doc.end();
}

module.exports.comprobante = comprobante;