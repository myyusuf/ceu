'use strict'

exports.find = function findDepartment(request, reply) {
  const db = this.db;

  const searchText = request.query.searchText || '';
  const namaLike = `%${searchText}%`;
  const kodeLike = `%${searchText}%`;
  const level = request.query.studentLevel;

  const query = `
    SELECT
      *
    FROM
      tb_bagian
    WHERE
      (
        kode LIKE ?
        OR
        nama LIKE ?
      )
      AND
      tingkat = ? `;

  db.query(query, [kodeLike, namaLike, level], (err, rows) => {
    if (err) {
      reply('Error while doing operation.').code(500);
      return;
    }
    reply(rows);
  });
};

exports.findAll = function findAllDepartment(request, reply) {
  const db = this.db;

  const query = 'SELECT * FROM tb_bagian';

  db.query(query, [], (err, rows) => {
    console.log(err);
    if (err) { reply('Error while doing operation.').code(500); return; }
    reply(rows);
  });
};

exports.create = function createDepartment(request, reply) {
  const department = {
    kode: request.payload.kode,
    nama: request.payload.nama,
    tingkat: request.payload.tingkat,
    durasi_minggu: request.payload.durasi_minggu,
    durasi_minggu_rs1: request.payload.durasi_minggu_rs1,
    durasi_minggu_rs2: request.payload.durasi_minggu_rs2,
    durasi_minggu_klinik: request.payload.durasi_minggu_klinik,
    keterangan: request.payload.keterangan,
    warna: request.payload.warna,
  };

  this.db.query('INSERT INTO tb_bagian SET ?', department, (err, result) => {
    if (err) {
      console.dir(err);
      reply(err.message).code(500);
    } else {
      console.dir(result);
      reply({ status: 'ok' });
    }
  });
};

exports.update = function updateDepartment(request, reply) {
  const department = request.payload;
  const kode = request.params.kode;

  this.db.query(
    `UPDATE
      tb_bagian
    SET
      nama = ?,
      tingkat = ?,
      durasi_minggu = ?,
      durasi_minggu_rs1 = ?,
      durasi_minggu_rs2 = ?,
      durasi_minggu_klinik = ?,
      keterangan = ?,
      warna = ?
    WHERE
      kode = ?`,
    [
      department.nama,
      department.tingkat,
      department.durasi_minggu,
      department.durasi_minggu_rs1,
      department.durasi_minggu_rs2,
      department.durasi_minggu_klinik,
      department.keterangan,
      department.warna,
      kode,
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

exports.delete = function deleteDepartment(request, reply) {
  const kode = request.params.kode;
  this.db.query(
  'DELETE FROM tb_bagian WHERE kode = ? ',
  [kode], (err, result) => {
    if (err) {
      console.dir(err);
      reply(err.message).code(500);
    } else {
      console.dir(result);
      reply({ status: 'ok' });
    }
  });
};
