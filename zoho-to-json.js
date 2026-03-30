const calendarios = [
 { nombre: "Calendario1", url: "https://calendar.zoho.com/ical/zz08011230dced9dbf9385a10e4ee33f4272ba2780bc17abc3b81c3557ddabf3ff926da430f1c4c54553b020a530f8137f48d38576/pvt_6ac15144740248fb835553c960011a08" },
 { nombre: "Calendario2", url: "https://calendar.zoho.com/ical/zz0801123052345444cad2f782cfc89e981a59a87141bf9a3547208701094ac59f02975572f0de34651609eb21081cf93e62793c10/pvt_d4498bee049448f99fd11bab2758042e" },
 { nombre: "Calendario3", url: "https://calendar.zoho.com/ical/zz080112301018c3f13dcf55ee377aae34212304089a11eacaf6c5c9bdbe36ea4273dec53e6718a57a4358fc6350e0851846b972ff" },
 { nombre: "Calendario4", url: "https://calendar.zoho.com/ical/zz08011230c329051509f26dff66f39b8fffa452a0c44547892da30adcde77e32c750172eaf756c34d195b920fb45dbcfa5f0e3de5/pvt_50ee096e898a409b8ea49f1b159b9ea7" },
 { nombre: "Calendario5", url: "https://calendar.zoho.com/ical/zz080112303540f6bb958f62d5fa0975e84b07df8d576f149dcc60217eec78975e491d78828e4123446809afd78541af075efa7351/pvt_c854e69aaba648eaa7c2f2972262de13" },
 { nombre: "Calendario6", url: "https://calendar.zoho.com/ical/zz08011230d16f155f259d64d433b741ea9300b6bda2563bf1e4840cd33fb26fed65f7e2bab5f1bb0c66d826e347b86537d8865ad4/pvt_226dbc3b55b34011bf7e9011aa3e89fe" },
 { nombre: "Calendario7", url: "https://calendar.zoho.com/ical/zz0801123053021494b7400269d163a1a5ace40a3238fe09c8437920d4dba6611e2d4a2a313d6f703287081592a99ea8de4a6da2d1/pvt_6c480daf6d764b908433fa7f2a003b7c" },
 { nombre: "Calendario8", url: "https://calendar.zoho.com/ical/zz08011230f2e521529818a4fe653e7eed02418ffb8e8ae3e3933b0c9700580ea1f3513dd866c7d11dc8b0af50469b83ec48b1478e/pvt_30537b25bdc944daab738d2f9858ce22" },
 { nombre: "Calendario9", url: "https://calendar.zoho.com/ical/zz080112305c0a09445aec6d2ebf06550edc21b76302c2dc4e21b5fd31381543c8d9fbe37ca187a4ab2686758bea6556962de052fd/pvt_2a40cc033c89462b98c993ffe2f88902" }
];

async function obtenerEventos() {

 const eventos = [];

 for (const cal of calendarios) {

   const res = await fetch(cal.url);
   const texto = await res.text();

   const bloques = texto.split("BEGIN:VEVENT");

   bloques.forEach(b => {

     const titulo = b.match(/SUMMARY:(.*)/);
     const inicio = b.match(/DTSTART.*:(.*)/);
     const fin = b.match(/DTEND.*:(.*)/);
     const descripcion = b.match(/DESCRIPTION:(.*)/);

     if (titulo && inicio) {

       eventos.push({
         calendario: cal.nombre,
         titulo: titulo[1].trim(),
         inicio: inicio[1].trim(),
         fin: fin ? fin[1].trim() : null,
         descripcion: descripcion ? descripcion[1].trim() : ""
       });

     }

   });

 }

 return eventos;

}

async function generarJSON() {

 const eventos = await obtenerEventos();

 const fs = require("fs");

 fs.writeFileSync(
   "events.json",
   JSON.stringify(eventos, null, 2)
 );

 console.log("JSON generado con", eventos.length, "eventos");

}

generarJSON();