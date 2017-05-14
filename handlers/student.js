const flow = require('nimble');

exports.find = function findStudent(request, reply) {
  const db = this.db;

  const result = { data: [], totalRecords: 0 };
  const series = [];

  const searchText = request.query.searchText || '';

  const pagesize = parseInt(request.query.pagesize, 10);
  const pagenum = parseInt(request.query.pagenum, 10) - 1;
  const stambukLamaLike = `${searchText}%`;
  const stambukBaruLike = `${searchText}%`;
  const namaLike = `%${searchText}%`;
  const level = request.query.studentLevel;

  const studentStatus = request.query['studentStatus[]'] || [];

  const selectStudents = (callback) => {
    const query =
    `SELECT
      ts.*,
      tsb.status_bagian,
      tsb.progres_keseluruhan
    FROM
      tb_siswa ts
    LEFT JOIN
      tb_status_bagian_diambil tsb ON ts.id = tsb.siswa_id
    WHERE
      (
        stambuk_lama LIKE ? OR
        stambuk_baru LIKE ? OR
        nama LIKE ?
      )
    AND
      tingkat = ?
    AND
      status IN (?)
    ORDER BY
      nama
    LIMIT ?,? `;

    db.query(query, [
      stambukLamaLike,
      stambukBaruLike,
      namaLike,
      level,
      studentStatus,
      pagenum * pagesize,
      pagesize,
    ], (err, rows) => {
      if (err) callback(err);
      result.data = rows;
      callback();
    });
  };

  const countStudents = (callback) => {
    const query =
    `SELECT
      count(1) as totalRecords
    FROM
      tb_siswa
    WHERE
      (
        stambuk_lama LIKE ? OR
        stambuk_baru LIKE ? OR
        nama LIKE ?
      )
      AND
        tingkat = ?
      AND
        status IN (?) `;

    db.query(
      query, [
        stambukLamaLike,
        stambukBaruLike,
        namaLike,
        level,
        studentStatus,
      ], (err, rows) => {
        if (err) callback(err);
        result.totalRecords = rows[0].totalRecords;
        callback();
      });
  };

  series.push(selectStudents, countStudents);

  flow.series(series, (error) => {
    if (error) {
      console.log(error);
      reply('Error while doing operation.').code(500);
    } else {
      reply(result);
    }
  });
};

exports.findOne = function findOneStudent(request, reply) {
  const db = this.db;

  const studentId = request.params.studentId;

  const query = 'SELECT * FROM tb_siswa WHERE id = ? ';

  db.query(
    query, [studentId],
     (err, rows) => {
       if (err) reply('Error while doing operation.').code(500);
       if (rows.length > 0) {
         reply(rows[0]);
       }
     });
};

exports.create = function createStudent(request, reply) {
  console.dir(request);
  reply({ result: 'OK' });
  // const createStudent = () => {
  //   const student = {
  //     stambuk_lama: req.body.stambukLama,
  //     stambuk_baru: req.body.stambukBaru,
  //     nama: req.body.nama,
  //     tingkat: req.body.tingkat
  //   };
  // }
  //
  // var student = {
  //   stambuk_lama: req.body.stambukLama,
  //   stambuk_baru: req.body.stambukBaru,
  //   nama: req.body.nama,
  //   tingkat: req.body.tingkat
  // };
  //
  // db.query('INSERT INTO tb_siswa SET ?', student, function(err, result){
  //   if(err){
  //     res.status(500).send('Error while doing operation, Ex. non unique stambuk');
  //   }else{
  //
  //     var studentId = result.insertId;
  //     var riwayatMppd = {
  //       siswa_id: studentId,
  //       status: '',
  //       bagian_bermasalah: ''
  //     };
  //
  //     db.query('INSERT INTO tb_riwayat_mppd SET ?', riwayatMppd, function(err, result){
  //       if(err){
  //         console.log(err);
  //         res.status(500).send('Error while doing operation.');
  //       }else{
  //         var tbUjianKompre = {
  //           siswa_id: studentId
  //         };
  //
  //         db.query('INSERT INTO tb_ujian_kompre SET ?', tbUjianKompre, function(err, result){
  //           if(err){
  //             console.log(err);
  //           }else{
  //             res.json({status: 'INSERT_SUCCESS'});
  //           }
  //
  //         });
  //       }
  //     });
  //   }
  // });
};
