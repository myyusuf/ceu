exports.find = function findDepartments(request, reply) {
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
