const flow = require('nimble');

exports.find = function findStudents(request, reply) {
  const db = this.db;

  const result = { data: [], totalRecords: 0 };
  const series = [];

  const searchTxt = request.query.searchTxt || '';

  const pagesize = parseInt(request.query.pagesize, 10);
  const pagenum = parseInt(request.query.pagenum, 10);
  const stambukLamaLike = `${searchTxt}%`;
  const stambukBaruLike = `${searchTxt}%`;
  const namaLike = `%${searchTxt}`;
  const level = request.query.level;

  console.log(stambukLamaLike);

  const selectStudents = function selectStudents(callback) {
    const query = 'SELECT * FROM tb_siswa WHERE (stambuk_lama LIKE ? or stambuk_baru LIKE ? or nama LIKE ?) AND tingkat = ? ORDER BY nama LIMIT ?,? ';

    db.query(
      query, [stambukLamaLike, stambukBaruLike, namaLike, level, pagenum * pagesize, pagesize],
       (err, rows) => {
         if (err) callback(err);
         result.data = rows;
         callback();
       }
    );
  };

  const countStudents = function countStudents(callback) {
    const query = 'SELECT count(1) as totalRecords FROM tb_siswa WHERE (stambuk_lama LIKE ? or stambuk_baru LIKE ? or nama LIKE ? ) and tingkat = ? ';
    db.query(
      query, [stambukLamaLike, stambukBaruLike, namaLike, level],
      (err, rows) => {
        if (err) callback(err);
        result.totalRecords = rows[0].totalRecords;
        callback();
      }
    );
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

exports.findOne = function findStudent(request, reply) {
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
     }
  );
};
