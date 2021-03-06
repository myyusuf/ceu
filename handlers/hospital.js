'use strict'

exports.find = function findHospital(request, reply) {
  const db = this.db;

  const searchText = request.query.searchText || '';
  const namaLike = `%${searchText}%`;
  const kodeLike = `%${searchText}%`;
  const hospitalTypes = request.query['hospitalTypes[]'] || [];

  const query = `
    SELECT
      *
    FROM
      tb_rumah_sakit
    WHERE
      (
        kode LIKE ?
        OR
        nama LIKE ?
      )
      AND
      tipe IN (?) `;

  db.query(query, [kodeLike, namaLike, hospitalTypes], (err, rows) => {
    if (err) {
      console.log(err);
      reply('Error while doing operation.').code(500);
      return;
    }
    reply(rows);
  });
};

exports.findAll = function findAllHospital(request, reply) {
  const db = this.db;

  const query = 'SELECT * FROM tb_rumah_sakit';

  db.query(query, [], (err, rows) => {
    console.log(err);
    if (err) { reply('Error while doing operation.').code(500); return; }
    reply(rows);
  });
};

exports.create = function createHospital(request, reply) {
  const hospital = {
    kode: request.payload.kode,
    nama: request.payload.nama,
    tipe: request.payload.tipe,
  };

  this.db.query('INSERT INTO tb_rumah_sakit SET ?', hospital, (err, result) => {
    if (err) {
      console.dir(err);
      reply(err.message).code(500);
    } else {
      console.dir(result);
      reply({ status: 'ok' });
    }
  });
};

exports.update = function updateHospital(request, reply) {
  const hospital = request.payload;
  const kode = request.params.kode;

  this.db.query(
    `UPDATE
      tb_rumah_sakit
    SET
      nama = ?,
      tipe = ?
    WHERE
      kode = ?`,
    [
      hospital.nama,
      hospital.tipe,
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

exports.delete = function deleteHospital(request, reply) {
  const kode = request.params.kode;
  this.db.query(
  'DELETE FROM tb_rumah_sakit WHERE kode = ? ',
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
