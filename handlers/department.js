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
    // description: request.payload.description,
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
