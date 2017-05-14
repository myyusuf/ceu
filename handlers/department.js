exports.find = function findDepartment(request, reply) {
  const db = this.db;

  const searchText = request.query.searchText || '';
  const namaLike = `%${searchText}%`;
  const level = request.query.studentLevel;

  const query = 'SELECT * FROM tb_bagian WHERE nama LIKE ? AND tingkat = ? ';

  db.query(query, [namaLike, level], (err, rows) => {
    if (err) reply('Error while doing operation.').code(500);
    reply(rows);
  });
};

exports.create = function createDepartment(request, reply) {
  const department = {
    kode: request.payload.kode,
    nama: request.payload.nama,
    tingkat: request.payload.tingkat,
    durasi_minggu: request.payload.durasi_minggu,
    keterangan: request.payload.keterangan,
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
      keterangan = ?
    WHERE
      kode = ?`,
    [
      department.nama,
      department.tingkat,
      department.durasi_minggu,
      department.keterangan,
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
