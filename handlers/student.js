"use strict"

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

  const query = `
  SELECT
    ts.*,
    tps.tahun_masuk,
    tps.tahun_lulus,
    tps.nomer_ijazah,
    tps.ipk,
    tks.alamat,
    tks.telepon,
    tks.handphone,
    tks.email
  FROM
    tb_siswa ts
  LEFT JOIN tb_pendidikan_siswa tps ON ts.id = tps.siswa_id
  LEFT JOIN tb_kontak_siswa tks ON ts.id = tks.siswa_id
  WHERE
    ts.id = ? `;

  db.query(
    query, [studentId],
     (err, rows) => {
       if (err) {
         console.log(err);
         reply('Error while doing operation.').code(500);
         return;
       }

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

  const insertTbKontakSiswa = function insertTbKontakSiswa(callback) {
    const tbKontakSiswa = {
      siswa_id: result.studentCreatedId,
    };

    db.query('INSERT INTO tb_kontak_siswa SET ?', tbKontakSiswa, (err, insertResult) => {
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
  };

  const insertTbPendidikanSiswa = function insertTbPendidikanSiswa(callback) {
    const tbPendidikanSiswa = {
      siswa_id: result.studentCreatedId,
    };

    db.query('INSERT INTO tb_pendidikan_siswa SET ?', tbPendidikanSiswa, (err, insertResult) => {
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
  };

  series.push(insertStudent,
    insertStatusBagianDiambil,
    insertTbKontakSiswa,
    insertTbPendidikanSiswa);

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
  const db = this.db;
  const series = [];
  const result = { status: 'OK' };

  const infoForm = request.payload.infoForm;
  const educationForm = request.payload.educationForm;
  const contactForm = request.payload.contactForm;

  const id = request.params.id;
  let tanggalLahir = null;

  if (infoForm.tanggal_lahir) {
    tanggalLahir = moment(infoForm.tanggal_lahir, 'YYYY-MM-DD').toDate();
  }

  console.log(infoForm);
  console.log(educationForm);
  console.log(contactForm);

  const updateStudentInfo = function updateStudentInfo(callback) {
    db.query(
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
        infoForm.stambuk_lama,
        infoForm.stambuk_baru,
        infoForm.nama,
        infoForm.tingkat,
        infoForm.tempat_lahir,
        tanggalLahir,
        infoForm.gender,
        id,
      ], (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      });
  };

  const updateStudentEducation = function updateStudentEducation(callback) {
    if (educationForm === undefined) {
      callback();
      return;
    }

    db.query(
      `UPDATE
        tb_pendidikan_siswa
      SET
        tahun_masuk = ?,
        tahun_lulus = ?,
        nomer_ijazah = ?,
        ipk = ?
      WHERE
        id = ?`,
      [
        educationForm.tahun_masuk,
        educationForm.tahun_lulus,
        educationForm.nomer_ijazah,
        educationForm.ipk,
        id,
      ], (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      });
  };

  const updateStudentContact = function updateStudentContact(callback) {
    if (contactForm === undefined) {
      callback();
      return;
    }

    db.query(
      `UPDATE
        tb_kontak_siswa
      SET
        alamat = ?,
        telepon = ?,
        handphone = ?,
        email = ?
      WHERE
        id = ?`,
      [
        contactForm.alamat,
        contactForm.telepon,
        contactForm.handphone,
        contactForm.email,
        id,
      ], (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      });
  };

  series.push(updateStudentInfo,
    updateStudentEducation,
    updateStudentContact);

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
