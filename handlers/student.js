const flow = require('nimble');
const moment = require('moment');

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
      tsb.progres_keseluruhan,
      tb.nama AS nama_bagian,
      tb.warna AS warna_bagian
    FROM
      tb_siswa ts
    LEFT JOIN
      tb_status_bagian_diambil tsb ON ts.id = tsb.siswa_id
    LEFT JOIN
      tb_bagian_diambil tbd ON tbd.id = tsb.bagian_diambil_id
    LEFT JOIN
      tb_bagian tb ON tb.id = tbd.bagian_id
    WHERE
      (
        ts.stambuk_lama LIKE ? OR
        ts.stambuk_baru LIKE ? OR
        ts.nama LIKE ?
      )
    AND
      ts.tingkat = ?
    AND
      ts.status IN (?)
    ORDER BY
      ts.nama
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
  const series = [];
  const result = {};
  const db = this.db;

  const insertStudent = function insertStudent(callback) {
    const student = {
      stambuk_lama: request.payload.stambuk_lama,
      stambuk_baru: request.payload.stambuk_baru,
      nama: request.payload.nama,
      tingkat: request.payload.tingkat,
      gender: request.payload.gender,
    };

    db.query('INSERT INTO tb_siswa SET ?', student, (err, insertResult) => {
      if (err) {
        callback(err);
      } else {
        result.studentCreatedId = insertResult.insertId;
        callback();
      }
    });
  };

  const insertStatusBagianDiambil = function insertStatusBagianDiambil(callback) {
    const tbStatusBagianDiambil = {
      siswa_id: result.studentCreatedId,
    };

    db.query('INSERT INTO tb_status_bagian_diambil SET ?', tbStatusBagianDiambil, (err, insertResult) => {
      if (err) {
        callback(err);
      } else {
        result.statusCreatedId = insertResult.insertId;
        callback();
      }
    });
  };

  series.push(insertStudent, insertStatusBagianDiambil);

  db.beginTransaction((err) => {
    if (err) { throw err; }
    flow.series(series, (error) => {
      if (error) {
        console.log(error);
        db.rollback(() => {
          reply('Error while doing operation.').code(500);
        });
      } else {
        db.commit((errCommit) => {
          if (errCommit) {
            db.rollback(() => {
              reply('Error while doing operation.').code(500);
            });
          }
          reply(result);
        });
      }
    });
  });
};

exports.update = function updateDepartment(request, reply) {
  const student = request.payload;
  const id = request.params.id;
  let tanggalLahir = null;

  if (student.tanggal_lahir) {
    tanggalLahir = moment(student.tanggal_lahir, 'YYYY-MM-DD').toDate();
  }

  this.db.query(
    `UPDATE
      tb_siswa
    SET
      stambuk_lama = ?,
      stambuk_baru = ?,
      nama = ?,
      tingkat = ?,
      tempat_lahir = ?,
      tanggal_lahir = ?,
      gender = ?
    WHERE
      id = ?`,
    [
      student.stambuk_lama,
      student.stambuk_baru,
      student.nama,
      student.tingkat,
      student.tempat_lahir,
      tanggalLahir,
      student.gender,
      id,
    ], (err, result) => {
      if (err) {
        console.dir(err);
        reply(err.message).code(500);
      } else {
        console.dir(result);
        reply({ status: 'ok' });
      }
    });
};
